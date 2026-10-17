// 今、画面を見ている人（最初は佐藤部長）
let currentUserId = "m01";

// 今、開いている案件（null なら受信箱を表示）
let openCaseId = null;

// 管理者画面で、ツリーとタイムラインのどちらを表示するか 
let adminView = "tree";

// 番号から社員を探す
function findMember(id) {
  return members.find(m => m.id === id);
}

// その案件が、もう送信されたか
function isSent(caseId) {
  return events.some(e => e.caseId === caseId && e.type === "送信");
}

// 今の人が、その案件をもう部下に送信したか
function isForwarded(caseId) {
  return events.some(e =>
    e.caseId === caseId && e.type === "転送" && e.actorId === currentUserId
  );
}

// 今の人から見た、案件の状態の表示名
function myLabel(c) {
  // 自分が送信者なら「送信済み」か「未送信」
  if (c.senderId === currentUserId) {
    return isSent(c.id) ? "送信済み" : "未送信";
  }
  // 受け取る側なら、getStatus の結果をそのまま使う
  return getStatus(c.id, currentUserId);
}

// 状態の名前から、バッジの色分け用のクラスを決める
function badgeClass(label) {
  if (label === "未受領" || label === "未送信") return "badge-warn";
  if (label === "受領済み" || label === "送信済み") return "badge-done";
  if (label === "未達") return "badge-missing";
  return "";
}


// 役割切り替えのプルダウンを作る
function setupUserSelect() {
  const select = document.getElementById("userSelect");

  members.forEach(m => {
    const option = document.createElement("option");
    option.value = m.id;
    option.textContent = `${m.name}（${m.dept} ${m.role}）`;
    select.appendChild(option);
  });

  select.value = currentUserId;

  // 人を切り替えたら、受信箱に戻して描き直す
  select.addEventListener("change", () => {
    currentUserId = select.value;
    openCaseId = null;
    render();
  });
}

// 受信箱：自分が送る案件と、自分に届いている案件を並べる
function renderInbox() {
  const app = document.getElementById("app");

  const myCases = cases.filter(c =>
    c.senderId === currentUserId || getStatus(c.id, currentUserId) !== "未達"
  );

  if (myCases.length === 0) {
    app.innerHTML = `<div class="card"><p>受信箱は空です</p></div>`;
    return;
  }

  // カードを押すと、その案件を開く
  app.innerHTML = myCases.map(c => {
    const sender = findMember(c.senderId);
    return `
      <div class="card case-card" onclick="openCase('${c.id}')">
        <div class="badges">
          <span class="badge badge-level">${c.level}</span>
          <span class="badge ${badgeClass(myLabel(c))}">${myLabel(c)}</span>
        </div>
        <h2 class="case-title">${c.title}</h2>
        <p class="meta">${sender.name} ${sender.role}から</p>
      </div>`;
  }).join("");
}

// 案件の詳細：本文と、今の人がやるべきボタンを表示する
function renderDetail() {
  const app = document.getElementById("app");
  const c = cases.find(x => x.id === openCaseId);
  const sender = findMember(c.senderId);
  const label = myLabel(c);

  // 状態によって、表示するボタンを変える
  let action = "";
  if (label === "未送信") {
    action = `<button class="btn-primary" onclick="send('${c.id}')">送信する</button>`;
  }
  if (label === "未受領") {
    action = `<button class="btn-primary" onclick="receive('${c.id}')">受け取りました</button>`;
  }
  if (label === "受領済み") {
    action = `<p class="done">受領済みです</p>`;
  }

  // 部下がいる人は、受領したあとに「下に流す」欄を表示する
  const subs = members.filter(m => m.bossId === currentUserId);
  let forwardArea = "";
  if (label === "受領済み" && subs.length > 0) {
    if (isForwarded(c.id)) {
      forwardArea = `<p class="done">部下への転送済みです</p>`;
    } else {
      forwardArea = `
      <div class="forward">
          <p class="meta">転送する部下を選んでください</p>
          ${subs.map(m => `
            <label class="check">
              <input type="checkbox" name="fwd" value="${m.id}" checked> ${m.name}
            </label>`).join("")}
          <button class="btn-primary" onclick="forward('${c.id}')">転送する</button>
        </div>`;
    }
  }

  app.innerHTML = `
    <button class="btn-back" onclick="closeCase()">← 受信箱に戻る</button>
    <div class="card case-card">
      <div class="badges">
        <span class="badge badge-level">${c.level}</span>
        <span class="badge ${badgeClass(label)}">${label}</span>
      </div>
      <h2 class="case-title">${c.title}</h2>
      <p class="meta">${sender.name} ${sender.role}から ・ 期限 ${c.deadline.replace("T", " ")}</p>
      <p class="body">${c.body}</p>
      ${action}
      ${forwardArea}
    </div>`;
}

// ===== ボタンを押したときの処理 =====

// 案件を開く
function openCase(caseId) {
  openCaseId = caseId;
  render();
}

// 受信箱に戻る
function closeCase() {
  openCaseId = null;
  render();
}

// 送信する：自分の直属の部下に送る
function send(caseId) {
  const to = members.filter(m => m.bossId === currentUserId).map(m => m.id);
  addEvent("送信", caseId, currentUserId, { to: to });
  render();
}

// 受け取りました：受領を記録する
function receive(caseId) {
  // ←ここを自分で書く
  addEvent("受領", caseId, currentUserId, {});
  render();
}


// 転送する：チェックが入っている部下に流す
function forward(caseId) {
  // チェックが入っている部下の番号を集める
  const checked = document.querySelectorAll('input[name="fwd"]:checked');
  const to = Array.from(checked).map(input => input.value);

  if (to.length === 0) {
    alert("転送先を選んでください");
    return;
  }

  addEvent("転送", caseId, currentUserId, { to: to });

  render();
}


// 一人分の枝（その人と、その部下たち）のHTMLを作るもの
function renderNode(c, memberId) {
  const m = findMember(memberId);

  // 送信者なら送信したかどうか、それ以外はgetStatusで状態を調べる
  const status = (m.id === c.senderId)
    ? (isSent(c.id) ? "送信済み" : "未送信")
    : getStatus(c.id, m.id);

  //未達なら、点線で目立たせる
  const missingClass = (status === "未達") ? " node-missing" : "";

  // この人の部下の内、届けるべき相手に入っている人
  const children = members.filter(x => x.bossId === m.id && c.targetIds.includes(x.id));

  // 部下がいれば、その部下たちにも同じ事を繰り返してえ枝を伸ばす
  const childrenHtml = (children.length > 0)
    ? `<ul>${children.map(x => renderNode(c, x.id)).join("")}</ul>`
    : "";
  
  return `
    <li>
      <span class="node${missingClass}">
          <strong>${m.name}</strong>
          <span class="meta">${m.dept} ${m.role}</span>
          <span class="badge ${badgeClass(status)}">${status}</span>
        </span>
        ${childrenHtml}
      </li>`;
}


// 管理者画面の表示を切り替える
function setAdminView(view) {
  adminView = view;
  render();
}


// 出来事一件を、タイムラインの一行にする
function describeEvent(c, e) {
  const actor = findMember(e.actorId);
  const toNames = (e.detail.to || []).map(id => findMember(id).name).join("、");

  // 出来事の種類によって、文章を変える
  let text = "";
  if (e.type === "送信") text = `${toNames} に送信しました`;
  if (e.type === "転送") text = `${toNames} に転送しました`;
  if (e.type === "受領") text = `受領しました`;

  // 送信・転送の時、届けるべき部下なのに外された人がいれば目印を出す
  let leftOut = "";
  if (e.type === "送信" || e.type === "転送") {
    const skipped = members.filter(x =>
      x.bossId === e.actorId && c.targetIds.includes(x.id) && !e.detail.to.includes(x.id)
    );
    if (skipped.length > 0) {
      leftOut = `<br><span class="tag-warn">${skipped.map(X => X.name).join("、")} には転送されていません</span>`;
    }
  }

  return `
  <li class="tl-row">
      <span class="tl-time">${new Date(e.at).toLocaleTimeString("ja-JP")}</span>
      <span>
        <strong>${actor.name}</strong>
        <span class="meta">${actor.dept} ${actor.role}</span><br>
        ${text}${leftOut}
      </span>
    </li>`;
}


// 案件一件分のタイムラインを作る
function renderTimeline(c) {
  // この案件の記録だけを取り出す
  const caseEvents = events.filter(e => e.caseId === c.id)

  if(caseEvents.length === 0) {
    return `<p class="meta">まだ記録がありません</p>`;
  }
  return `<ol class="timeline">${caseEvents.map(e => describeEvent(c, e)).join("")}</ol>`;
}


// 管理者画面：案件ごとに要確認の通知と伝達ツリーを表示
function renderAdmin() {
  const app = document.getElementById("app");

  app.innerHTML = cases.map(c => {
    // まだ届いていない人の名前の一覧
    const missingNames = findMissing(c.id).map(id => findMember(id).name);

    // 1人でもいれば、要確認の通知を出す
    const alertBox = (missingNames.length > 0) ? `
      <div class="alert">
        <p class="alert-title">要確認：まだ届いていない人がいます</p>
        <p>${missingNames.join("、")}</p>
        <p class="meta">これは記録上の状況です。意図があったかどうかは、確認の手続きで判断してください。</p>
      </div>` : "";

    // 選んでいる表示に合わせて、中身を切り替える
    const content = (adminView === "tree")
      ? `<ul class="tree">${renderNode(c, c.senderId)}</ul>`
      : renderTimeline(c);

    return `
      ${alertBox}
      <div class="toggle">
        <button class="${adminView === "tree" ? "on" : ""}" onclick="setAdminView('tree')">ツリー表示</button>
        <button class="${adminView === "timeline" ? "on" : ""}" onclick="setAdminView('timeline')">タイムライン表示</button>
      </div>
      <div class="card">
        <div class="badges"><span class="badge badge-level">${c.level}</span></div>
        <h2 class="case-title">${c.title}</h2>
        ${content}
      </div>`;
  }).join("");
}


// 最初からやり直す：記録を空にして、最初の画面に戻す
function resetDemo() {
  // 確認の窓を出し、「キャンセル」なら何もしない
  if(!confirm("記録をすべて消して、最初からやり直しますか？")) return;

  // 記録を空にする　※デモ用の機能。本番のアプリでは記録は消さない。
  events.length = 0;

  currentUserId = "m01";
  openCaseId = null;
  adminView = "tree";

  document.getElementById("userSelect").value = currentUserId;
  render();
}


// 画面全体を描き直す（案件を開いていれば詳細、なければ受信箱）
function render() {
  const me = findMember(currentUserId);
  const app = document.getElementById("app");

  // 管理者はPCの幅、それ以外はスマホ幅の枠で表示する
  app.className = (me.role === "管理者") ? "view-admin" : "view-phone";

  if (me.role === "管理者") {
    renderAdmin();
  } else if (openCaseId) {
    renderDetail();
  } else {
    renderInbox();
  }
}

// ページを開いたときに最初に実行する
setupUserSelect();
render();