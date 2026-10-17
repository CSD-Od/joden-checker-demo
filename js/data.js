// ===== 架空の社員と組織 =====
// bossId は「直属の上司のid」。社長や部長のように上司がいない場合は null
const members = [
  { id: "m01", name: "佐藤 誠",   role: "部長", dept: "品質管理部", bossId: null },
  { id: "m02", name: "高橋 浩二", role: "課長", dept: "倉庫第1課",  bossId: "m01" },
  { id: "m03", name: "中村 由美", role: "課長", dept: "倉庫第2課",  bossId: "m01" },
  { id: "m04", name: "伊藤 大輔", role: "担当", dept: "倉庫第1課",  bossId: "m02" },
  { id: "m05", name: "山本 彩",   role: "担当", dept: "倉庫第1課",  bossId: "m02" },
  { id: "m06", name: "小林 健",   role: "担当", dept: "倉庫第1課",  bossId: "m02" },
  { id: "m07", name: "加藤 舞",   role: "担当", dept: "倉庫第2課",  bossId: "m03" },
  { id: "m08", name: "吉田 翔",   role: "担当", dept: "倉庫第2課",  bossId: "m03" },
  { id: "m09", name: "渡辺 葵",   role: "担当", dept: "倉庫第2課",  bossId: "m03" },
  { id: "a01", name: "コンプライアンス課", role: "管理者", dept: "コンプライアンス課", bossId: null }
];

// ===== 架空の案件 =====
// targetIds は「この情報を届けるべき人」の一覧。未達の判定に使う
const cases = [
  {
    id: "c01",
    title: "安全手順書の改訂（フォークリフト作業）",
    level: "必須教育",
    version: "v1",
    senderId: "m01",
    deadline: "2026-10-03T17:00",
    body: "倉庫内でのフォークリフト作業の手順を改訂しました。作業開始前の点検に「バックブザーの作動確認」を追加します。歩行者通路を横切るときは、一時停止して左右を確認してください。",
    targetIds: ["m02", "m03", "m04", "m05", "m06", "m07", "m08", "m09"]
  }
];

// ===== 出来事の記録 =====
// 送信・受領・転送などが起きるたびに、ここに1件ずつ追記していく
// 最初は空っぽ。「書き換えない・消さない」がルール
const events = [];