// esto va a crecer un montón a futuro, por ahora solo lo uso para los textos como el de día 28 y 35

function addTooltipsToChineseText(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const paragraphs = container.querySelectorAll("p");

    paragraphs.forEach(paragraph => {
        let html = paragraph.innerHTML;

        // Replace characters followed by pinyin with the tooltip structure
        html = html.replace(/([\u4e00-\u9fff]+)\[([^\]]+)\]/g, (match, chars, pinyin) => {
            return `<span class="tooltip" data-tooltip="${pinyin}">${chars}</span>`;
        });

        paragraph.innerHTML = html;
    });
}