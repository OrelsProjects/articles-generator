"use client";

import { unformatText } from "@/lib/utils/text-editor";
import { Logger } from "@/logger";

export const copyTextEditorContent = () => {
  const divId = "text-editor-tiptap";
  const copyDiv = document.getElementById(divId);

  if (copyDiv) {
    const elementToCopy = copyDiv.querySelector("p"); // otherwise we will copy the whole div
    if (!elementToCopy) {
      console.error("Element to copy from could not be found");
      return;
    }
    navigator.clipboard
      .write([
        new ClipboardItem({
          "text/plain": new Blob([elementToCopy.innerText], {
            type: "text/plain",
          }),
          "text/html": new Blob([elementToCopy.innerHTML], {
            type: "text/html",
          }),
        }),
      ])
      .catch((err: any) => {
        Logger.error("Could not copy text: ", err);
      });
  } else {
    Logger.error("Element to copy from could not be found");
  }
};

// const htmlToRichText = (html: string) => {
//   const type = "text/html";
//   const blob = new Blob([html], { type });
//   const data = [new ClipboardItem({ [type]: blob })];

//   return data;
// };

export const copyHTMLToClipboard = async (html: string) => {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([unformatText(html)], {
          type: "text/plain",
        }),
      }),
    ]);
  } catch (err) {
    console.error("Clipboard write failed", err);
  }
};
