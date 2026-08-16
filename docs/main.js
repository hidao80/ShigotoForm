(function () {
  "use strict";

  var META = {
    ja: {
      title: "ShigotoForm — あなたの履歴書は、あなたのデバイスの中に",
      description: "ShigotoForm — 個人情報を一切送信しない、ブラウザ完結型の履歴書作成PWA。JIS規格レイアウトのA4 PDFを無料で出力。"
    },
    en: {
      title: "ShigotoForm — Your Resume, Your Device",
      description: "ShigotoForm — A browser-only resume builder that never transmits your data. Free JIS-standard A4 PDF export."
    },
    zh: {
      title: "ShigotoForm — 简历只留在你的设备上",
      description: "ShigotoForm — 完全在浏览器端运行、绝不上传数据的简历制作 PWA。免费导出符合日本 JIS 标准的 A4 PDF。"
    },
    es: {
      title: "ShigotoForm — Tu currículum, en tu propio dispositivo",
      description: "ShigotoForm — Una PWA para crear currículums que funciona solo en el navegador y nunca transmite tus datos. Exporta PDF A4 con formato JIS gratis."
    },
    ru: {
      title: "ShigotoForm — Ваше резюме остаётся на вашем устройстве",
      description: "ShigotoForm — PWA для создания резюме, работающее полностью в браузере и никогда не передающее ваши данные. Бесплатный экспорт PDF формата A4 по стандарту JIS."
    }
  };

  var LANGUAGES = ["ja", "en", "zh", "es", "ru"];
  var STORAGE_KEY = "shigotoform-lp-lang";

  function detectLanguage() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || "ja").slice(0, 2);
    return LANGUAGES.indexOf(nav) !== -1 ? nav : "en";
  }

  function applyMeta(lang) {
    var meta = META[lang] || META.en;
    document.title = meta.title;
    var descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute("content", meta.description);
    document.documentElement.setAttribute("lang", lang);
  }

  var ml = new MultilanguageJS({ languages: LANGUAGES, defaultLanguage: "en" });

  function setLanguage(lang) {
    ml.setLanguage(lang);
    applyMeta(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    var select = document.getElementById("lang-select");
    if (select) select.value = lang;
  }

  document.addEventListener("DOMContentLoaded", function () {
    setLanguage(detectLanguage());

    var select = document.getElementById("lang-select");
    if (select) {
      select.addEventListener("change", function () {
        setLanguage(select.value);
      });
    }

    document.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy") || "";
        navigator.clipboard.writeText(text).then(function () {
          btn.classList.add("copied");
          setTimeout(function () {
            btn.classList.remove("copied");
          }, 1500);
        });
      });
    });
  });
})();
