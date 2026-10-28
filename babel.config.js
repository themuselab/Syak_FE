const fs = require('fs');
const path = require('path');

// lucide-react-native는 아이콘 3,400여 개를 한 배럴 파일에서 re-export한다. Metro는 tree-shaking을 안 해서
// `import { Star } from 'lucide-react-native'` 한 줄로 전 아이콘(웹 번들 ~1.2MB)이 딸려 온다.
// 쓰는 아이콘 파일만 직접 import하도록 빌드 때 바꿔 준다(Next.js optimizePackageImports와 같은 역할).
// 이름→파일 매핑은 배럴 파일에서 읽으므로 AlertCircle 같은 별칭도 맞는 파일로 간다.
function lucideDirectImports({ types: t }) {
  // main = dist/cjs/lucide-react-native.js → 옆의 dist/esm (package.json은 exports에 없어 resolve 불가)
  const esmDir = path.join(path.dirname(require.resolve('lucide-react-native')), '../esm');
  const barrel = fs.readFileSync(path.join(esmDir, 'lucide-react-native.mjs'), 'utf8');
  const iconFile = new Map();
  for (const [, names, file] of barrel.matchAll(/export \{([^}]*)\} from '\.\/(icons\/[^']+)'/g)) {
    // package exports에 개별 아이콘 경로가 없어 절대경로로 지정한다(Metro exports 경고 회피).
    const abs = path.join(esmDir, file).split(path.sep).join('/');
    for (const m of names.matchAll(/default as (\w+)/g)) iconFile.set(m[1], abs);
  }

  return {
    visitor: {
      ImportDeclaration(p) {
        if (p.node.source.value !== 'lucide-react-native' || p.node.importKind === 'type') return;
        const specs = p.node.specifiers;
        const direct = specs.filter(
          (s) => t.isImportSpecifier(s) && s.importKind !== 'type' && iconFile.has(s.imported.name),
        );
        if (direct.length === 0) return;
        const rest = specs.filter((s) => !direct.includes(s));
        const imports = direct.map((s) =>
          t.importDeclaration([t.importDefaultSpecifier(t.identifier(s.local.name))], t.stringLiteral(iconFile.get(s.imported.name))),
        );
        if (rest.length > 0) imports.push(t.importDeclaration(rest, p.node.source));
        p.replaceWithMultiple(imports);
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [lucideDirectImports],
  };
};
