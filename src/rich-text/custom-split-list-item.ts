/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Attrs, Fragment, NodeType, Slice } from "prosemirror-model";
import {
    Command,
    EditorState,
    NodeSelection,
    Transaction,
    Selection,
} from "prosemirror-state";
import { canSplit } from "prosemirror-transform";

// https://discuss.prosemirror.net/t/splitting-a-todo-list-item/4986
export function customSplitListItem(
    itemType: NodeType,
    itemAttrs?: Attrs
): Command {
    return function (state: EditorState, dispatch?: (tr: Transaction) => void) {
        const { $from, $to, node } = state.selection as NodeSelection;
        if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to))
            return false;
        const grandParent = $from.node(-1);
        if (grandParent.type != itemType) return false;
        if (
            $from.parent.content.size == 0 &&
            $from.node(-1).childCount == $from.indexAfter(-1)
        ) {
            // In an empty block. If this is a nested list, the wrapping
            // list item should be split. Otherwise, bail out and let next
            // command handle lifting.
            if (
                $from.depth == 3 ||
                $from.node(-3).type != itemType ||
                $from.index(-2) != $from.node(-2).childCount - 1
            )
                return false;
            if (dispatch) {
                let wrap = Fragment.empty;
                const depthBefore = $from.index(-1)
                    ? 1
                    : $from.index(-2)
                      ? 2
                      : 3;
                // Build a fragment containing empty versions of the structure
                // from the outer list item to the parent node of the cursor
                for (
                    let d = $from.depth - depthBefore;
                    d >= $from.depth - 3;
                    d--
                )
                    wrap = Fragment.from($from.node(d).copy(wrap));
                const depthAfter =
                    $from.indexAfter(-1) < $from.node(-2).childCount
                        ? 1
                        : $from.indexAfter(-2) < $from.node(-3).childCount
                          ? 2
                          : 3;
                // Add a second list item with an empty default start node
                wrap = wrap.append(Fragment.from(itemType.createAndFill()));
                const start = $from.before($from.depth - (depthBefore - 1));
                const tr = state.tr.replace(
                    start,
                    $from.after(-depthAfter),
                    new Slice(wrap, 4 - depthBefore, 0)
                );
                let sel = -1;
                tr.doc.nodesBetween(start, tr.doc.content.size, (node, pos) => {
                    if (sel > -1) return false;
                    if (node.isTextblock && node.content.size == 0)
                        sel = pos + 1;
                });
                if (sel > -1)
                    tr.setSelection(Selection.near(tr.doc.resolve(sel)));
                dispatch(tr.scrollIntoView());
            }
            return true;
        }
        const nextType =
            $to.pos == $from.end()
                ? grandParent.contentMatchAt(0).defaultType
                : null;
        const tr = state.tr.delete($from.pos, $to.pos);
        const checkbox = grandParent.attrs.checkbox;
        console.log({ checkbox })
        const types = nextType
            ? [
                  itemAttrs
                      ? { type: itemType, attrs: { checked: false, checkbox } }
                      : { type: itemType, attrs: { checked: false, checkbox } },
                  { type: nextType, attrs: { checked: false, checkbox } },
              ]
            : [{ type: itemType, attrs: { checked: false, checkbox } }];
        if (!canSplit(tr.doc, $from.pos, 2, types)) return false;
        if (dispatch) dispatch(tr.split($from.pos, 2, types).scrollIntoView());
        return true;
    };
}
