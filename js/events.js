// 出来事を記録に追記する
// type: 出来事の種類（"送信" "受領" "転送" など）
// caseId: どの案件か
// actorId: 誰がしたか
// detail: 追加の情報（転送先など）
function addEvent(type, caseId, actorId, detail){
  const event = {
    type: type,
    caseId: caseId,
    actorId: actorId,
    detail: detail,
    at: new Date().toISOString()
  };
  events.push(event);
  return event;
}


// ある人の、ある条件での今の状態を調べる
function getStatus(caseId, memberId) {
  // この案件の記録だけを取り出す
  const caseEvents =events.filter(e => e.caseId === caseId);

  // この人の受領の記録があるか？
  const received = caseEvents.some(e => e.type === "受領" && e.actorId === memberId)
  if (received) return "受領済み";

  // この人宛の送信か転送の記録があるか？
  const delivered = caseEvents.some(e =>
  (e.type === "送信" || e.type === "転送") &&
  (e.detail.to || []).includes(memberId)
  );
  if (delivered) return "未受領";

  return "未達";
}


// 届けるべき人のうち、まだ届いてない人を見つける
function findMissing(caseId) {
  // この案件を探す
  const theCase = cases.find(c => c.id === caseId);

  // 届けるべき人の中から、状態が未達の人だけを残す
  const missing = theCase.targetIds.filter(id => getStatus(caseId, id) === "未達");

  return missing;
}