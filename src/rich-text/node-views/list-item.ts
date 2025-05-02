/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-unsanitized/property */
import { Node as ProsemirrorNode } from "prosemirror-model";
import { EditorView, NodeView } from "prosemirror-view";
import { escapeHTML } from "../../shared/utils";

type getPosParam = boolean | (() => number);

/**
 * View with <code> wrapping/decorations for code_block nodes
 */
export class ListItemView implements NodeView {
    dom: HTMLElement | null;
    contentDOM?: HTMLElement | null;
    id: string;

    constructor(node: ProsemirrorNode, view: EditorView, getPos: getPosParam) {
        this.dom = document.createElement("li");
        this.dom.setAttribute("checkbox", `${node.attrs.checkbox}`);
        if (typeof getPos !== "function") {
            return;
        }
        const nodePos = getPos();
        if (node.attrs.checkbox) {
            this.dom.setAttribute("class", "task-item");
            this.dom.innerHTML = escapeHTML`<div class="task-item"><input type="checkbox" ${node.attrs.checked ? "checked" : ""}></input><div class="content-dom"></div></div>`;
            this.contentDOM = this.dom.querySelector(".content-dom");

            const input = this.dom.querySelector(".task-item").firstElementChild;
            input.addEventListener("change", (e) => {
                e.stopPropagation();

                // @ts-ignore
                const nodeAttrs = e.target.checked
                    ? { checkbox: 'true', checked: "true" }
                    : { checkbox: 'true' }
                view.dispatch(
                    view.state.tr.setNodeMarkup(getPos(), null, nodeAttrs)
                );
            });
            this.update(node);
        } else {
            this.dom.innerHTML = escapeHTML`<div class="content-dom"></div>`;
            this.contentDOM = this.dom.querySelector(".content-dom");
        }
        // https://discuss.prosemirror.net/t/is-this-the-right-way-to-determine-if-a-nodeview-is-selected/2208/2
        const nodeIsSelected =
            nodePos + 2 >= view.state.selection.$from.pos &&
            nodePos + node.nodeSize - 2 <= view.state.selection.$to.pos;
        if (!node.attrs.checkbox && node.attrs.text && nodeIsSelected) {
            setTimeout(() => {
                const insertTextTransaction = view.state.tr.insertText(
                    node.attrs.text as string,
                    view.state.selection.$from.pos
                );
                if (insertTextTransaction && view.dispatch) {
                    view.dispatch(insertTextTransaction);
                }
            }, 0);
            setTimeout(() => {
                const clearTextTransaction = view.state.tr.setNodeAttribute(
                    getPos(),
                    'text',
                    '',
                );
                if (clearTextTransaction && view.dispatch) {
                    view.dispatch(clearTextTransaction);
                }
            }, 0);
        }
        if (node.attrs.checkbox && node.attrs.text) {
            setTimeout(() => {
                this.dom.querySelector(".content-dom").innerHTML = node.attrs
                    .text as string;
            }, 0);
        }
    }

    update(node: ProsemirrorNode): boolean {
        if (!node.attrs.checkbox) {
            return true;
        }
        const input = this.dom.firstElementChild;
        if (node.attrs.checked) {
            input.setAttribute("checked", "true");
        } else {
            input.removeAttribute("checked");
        }
        return true;
    }
}
