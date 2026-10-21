/**
 * Split text utility for GSAP animations
 * Creates word and character level splits for animation
 */

export interface SplitTextResult {
  words: HTMLElement[];
  chars: HTMLElement[];
  lines: HTMLElement[];
}

export function splitText(
  element: HTMLElement,
  type: "words" | "chars" | "lines" | "words,chars" = "words"
): SplitTextResult {
  const result: SplitTextResult = {
    words: [],
    chars: [],
    lines: [],
  };

  const originalHTML = element.innerHTML;
  const text = element.textContent || "";

  if (!text.trim()) return result;

  // Split by words
  if (type.includes("words") || type.includes("chars")) {
    const words = text.split(/\s+/);
    const wordElements: HTMLElement[] = [];

    element.innerHTML = "";

    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.style.display = "inline-block";
      wordSpan.style.position = "relative";
      wordSpan.setAttribute("data-word-index", wordIndex.toString());

      if (type.includes("chars")) {
        // Split word into characters
        word.split("").forEach((char, charIndex) => {
          const charSpan = document.createElement("span");
          charSpan.textContent = char;
          charSpan.style.display = "inline-block";
          charSpan.style.position = "relative";
          charSpan.setAttribute("data-char-index", charIndex.toString());
          wordSpan.appendChild(charSpan);
          result.chars.push(charSpan);
        });
      } else {
        wordSpan.textContent = word;
      }

      element.appendChild(wordSpan);

      // Add space after word (except last)
      if (wordIndex < words.length - 1) {
        element.appendChild(document.createTextNode(" "));
      }

      wordElements.push(wordSpan);
    });

    result.words = wordElements;
  }

  return result;
}

export function revertSplit(element: HTMLElement, originalContent: string) {
  element.innerHTML = originalContent;
}
