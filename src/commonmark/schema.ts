/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Schema } from "prosemirror-model";

// create a modified schema for commonmark
export const commonmarkSchema = new Schema({
    nodes: {
        doc: {
            content: "code_block+",
        },
        text: {
            group: "inline",
        },
        code_block: {
            content: "text*",
            group: "block",
            marks: "",
            code: true,
            defining: true,
            isolating: true,
            // don't let the user select / delete
            selectable: false,
            // force the block language to always be markdown
            attrs: { params: { default: "markdown" } },
            parseDOM: [
                {
                    tag: "pre",
                    preserveWhitespace: "full",
                },
            ],
            toDOM() {
                return ["pre", { class: "s-code-block markdown" }, ["code", 0]];
            },
        },
        tag_link: {
            content: "text*",
            group: "block",
            marks: "",
            defining: true,
            isolating: true,
            // don't let the user select / delete
            selectable: false,
            attrs: { tagName: { default: "" } },
            parseDOM: [
                {
                    tag: "span",
                    preserveWhitespace: "full",
                },
            ],
            toDOM() {
                return ["span", { class: "s-tag" }, [0]];
            },
        },
        list_item: {
            content: "block*",
            // content: "text*",
            attrs: { checkbox: { default: "true" }, checked: { default: "false" }, text: { default: '' } },
            parseDOM: [
                {
                    tag: "li",
                    getAttrs: (dom) => {
                        return { 
                            checkbox: dom.getAttribute("checkbox"),
                            checked: dom.getAttribute("checked"),
                            text: dom.getAttribute("text"),
                        };
                    },
                    contentElement: 'li'
                },
            ],
            toDOM() {
                const checkbox = true;
                const attrs: Record<string, unknown> = { type: "checkbox", };
                if (checkbox) {
                    // @ts-ignore
                    attrs.checkbox = "true";
                }
                return [
                    "li",
                    { class: "task-item" },
                    ["input", { type: "checkbox", checked: attrs.checked || false }],
                    ["div", 0],
                ];
            },
        },
    },
    marks: {},
});
