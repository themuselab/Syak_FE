// 시술분야 목록. 홈 상단 카테고리 칩(CategoryChipBar)과 바텀시트 시술 필터(ServiceFilterContent)가
// 같은 store 필드(serviceFields)를 쓰므로 목록도 한 곳에서만 정의한다 — 한쪽만 늘어나는 걸 막는다.
// 백엔드 categories 허용 8종(syakBE Shop.ts)과 1:1.
export const SERVICE_FIELDS = ['네일', '헤어', '속눈썹', '왁싱', '반영구', '피부', '마사지', '태닝'];
