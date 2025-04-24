import MarkdownIt, { StateCore, Token } from "markdown-it";

function setUpListItem(tokens: Token[]) {
    let bulletListOpen = false;
    for (let i = 3; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token.type === 'bullet_list_open') {
            bulletListOpen = true;
        }
        if (token.type === 'bullet_list_close') {
            bulletListOpen = false;
        }
        if (token.type === 'inline' && tokens[i - 2].type === 'list_item_open' && bulletListOpen) {
            const checkbox = ['[ ] ', '[x] '].some(brackets => token.content.toLowerCase().startsWith(brackets))
            const checked = checkbox && token.content[1].toLowerCase() === 'x';
            const listItemToken = tokens[i - 2];
            listItemToken.attrSet("checkbox", checkbox ? `${checkbox}` : null);
            listItemToken.attrSet("checked", checked ? `${checked}` : null);
            const text = checkbox ? token.content.substring('[] '.length + 1) : token.content;
            listItemToken.attrSet("text", text);
        }
    }
}

export function set_up_list_item(md: MarkdownIt): void {
    md.core.ruler.push("checkbox", function (state: StateCore) {
        setUpListItem(state.tokens);
        return true;
    });
}
