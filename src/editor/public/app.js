const editor = ace.edit("editor", {
  mode: "ace/mode/matlab",
  theme: "ace/theme/tomorrow_night",
  fontSize: "14px",
  showPrintMargin: false,
  useWorker: false,
  tabSize: 2,
  wrap: true,
});
ace.config.set("basePath", "/assets");

const exampleSelect = document.querySelector("#example-select");
const docsSelect = document.querySelector("#docs-select");
const docsContent = document.querySelector("#docs-content");
const docsToc = document.querySelector("#docs-toc");
const output = document.querySelector("#output");
const status = document.querySelector("#editor-status");
const runButton = document.querySelector("#run-button");
const replForm = document.querySelector("#repl-form");
const replInput = document.querySelector("#repl-input");
const replSubmit = document.querySelector(".repl-submit");
const replSessionId =
  sessionStorage.getItem("istat-repl-session") ?? crypto.randomUUID();
sessionStorage.setItem("istat-repl-session", replSessionId);
const replHistory = [];
let replHistoryIndex = 0;
let selectedExample = null;

function setStatus(message, kind = "ready") {
  status.textContent = message;
  status.dataset.kind = kind;
}

function appendConsoleOutput(text) {
  output.textContent += `${output.textContent ? "\n\n" : ""}${text}`;
  output.scrollTop = output.scrollHeight;
}

async function loadExamples() {
  const response = await fetch("/api/examples");
  if (!response.ok) throw new Error("Örnekler yüklenemedi.");
  const examples = await response.json();
  const groups = new Map();
  for (const example of examples) {
    if (!groups.has(example.category)) {
      const group = document.createElement("optgroup");
      group.label = example.category;
      groups.set(example.category, group);
      exampleSelect.append(group);
    }
    const option = document.createElement("option");
    option.value = example.id;
    option.textContent = example.title;
    groups.get(example.category).append(option);
  }
  exampleSelect.addEventListener("change", () => {
    selectedExample = examples.find((example) => example.id === exampleSelect.value);
    if (selectedExample) {
      editor.setValue(selectedExample.code, -1);
      setStatus("Örnek yüklendi");
    }
  });
  exampleSelect.value = examples[0]?.id ?? "";
  exampleSelect.dispatchEvent(new Event("change"));
}

async function loadDocument(id) {
  docsContent.textContent = "Doküman yükleniyor…";
  docsToc.replaceChildren();
  const response = await fetch(`/api/docs/${encodeURIComponent(id)}`);
  const documentData = await response.json();
  if (!response.ok) throw new Error(documentData.error ?? "Doküman yüklenemedi.");
  docsContent.innerHTML = documentData.html;

  for (const heading of docsContent.querySelectorAll("h1, h2, h3")) {
    const slug = heading.textContent
      .toLocaleLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    heading.id = slug;
    const link = document.createElement("a");
    link.href = `#${slug}`;
    link.textContent = heading.textContent;
    link.className = `toc-link toc-${heading.tagName.toLowerCase()}`;
    docsToc.append(link);
  }
}

async function runCode() {
  const code = editor.getValue();
  if (!code.trim()) {
    output.textContent = "Çalıştırılacak kod yok.";
    return;
  }
  runButton.disabled = true;
  setStatus("Çalışıyor…", "running");
  try {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Kod çalıştırılamadı.");
    const sections = [...result.outputs];
    if (result.variables.length) {
      sections.push(
        `Değişkenler:\n${result.variables
          .map(({ name, formatted }) => `${name} =\n${formatted}`)
          .join("\n\n")}`
      );
    }
    if (!sections.length && result.result) sections.push(`ans =\n${result.result}`);
    appendConsoleOutput(`▶ Script\n${sections.join("\n\n") || "Kod hatasız çalıştı."}`);
    setStatus("Tamamlandı", "success");
  } catch (error) {
    appendConsoleOutput(`Script error: ${error.message}`);
    setStatus("Hata", "error");
  } finally {
    runButton.disabled = false;
  }
}

async function runReplCommand(event) {
  event.preventDefault();
  const code = replInput.value.trim();
  if (!code) return;

  replInput.value = "";
  replHistory.push(code);
  replHistoryIndex = replHistory.length;
  appendConsoleOutput(`iStat ❯ ${code}`);
  replInput.disabled = true;
  replSubmit.disabled = true;

  try {
    const response = await fetch("/api/repl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, sessionId: replSessionId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Komut çalıştırılamadı.");
    appendConsoleOutput(result.outputs.join("\n") || "Komut tamamlandı.");
  } catch (error) {
    appendConsoleOutput(`Error: ${error.message}`);
  } finally {
    replInput.disabled = false;
    replSubmit.disabled = false;
    replInput.focus();
  }
}

runButton.addEventListener("click", runCode);
replForm.addEventListener("submit", runReplCommand);
replInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" && replHistoryIndex > 0) {
    event.preventDefault();
    replHistoryIndex -= 1;
    replInput.value = replHistory[replHistoryIndex];
  } else if (event.key === "ArrowDown" && replHistoryIndex < replHistory.length) {
    event.preventDefault();
    replHistoryIndex += 1;
    replInput.value = replHistory[replHistoryIndex] ?? "";
  }
});
document.querySelector("#reset-button").addEventListener("click", () => {
  if (!selectedExample) return;
  editor.setValue(selectedExample.code, -1);
  setStatus("Örnek geri yüklendi");
});
document.querySelector("#clear-output").addEventListener("click", () => {
  output.textContent = "Konsol temizlendi. Oturum değişkenleri korunuyor.";
  setStatus("Hazır");
});
docsSelect.addEventListener("change", () => {
  loadDocument(docsSelect.value).catch((error) => {
    docsContent.textContent = error.message;
  });
});
docsContent.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest("a");
  if (!link) return;
  const match = link.pathname.match(/^\/(language|library|cli)\.md$/);
  if (match) {
    event.preventDefault();
    docsSelect.value = match[1];
    loadDocument(match[1]).catch((error) => {
      docsContent.textContent = error.message;
    });
  } else if (link.origin !== window.location.origin) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
});
editor.commands.addCommand({
  name: "runIstatCode",
  bindKey: { mac: "Command-Enter", win: "Ctrl-Enter" },
  exec: runCode,
});
editor.session.on("change", () => setStatus("Düzenlendi"));

Promise.all([
  loadExamples(),
  fetch("/api/docs")
    .then((response) => response.json())
    .then((documents) => {
      for (const docEntry of documents) {
        const option = document.createElement("option");
        option.value = docEntry.id;
        option.textContent = docEntry.title;
        docsSelect.append(option);
      }
      docsSelect.value = "language";
      return loadDocument(docsSelect.value);
    }),
]).catch((error) => {
  output.textContent = error.message;
  setStatus("Başlatılamadı", "error");
});
