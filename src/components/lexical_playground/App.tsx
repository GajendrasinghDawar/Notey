/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  EditorModeAnnounceExtension,
  FocusManagerExtension,
  FocusTrapExtension,
  HistoryAnnounceExtension,
  RovingTabIndexExtension,
} from '@lexical/a11y';
import {$isCodeNode} from '@lexical/code';
import {
  $defaultShouldInsertAfter,
  AutoFocusExtension,
  ClearEditorExtension,
  ClickAfterLastBlockExtension,
  DecoratorTextExtension,
  HorizontalRuleExtension,
  SelectBlockExtension,
  SelectionAlwaysOnDisplayExtension,
  TabIndentationExtension,
  WatchEditableExtension,
} from '@lexical/extension';
import {HashtagExtension} from '@lexical/hashtag';
import {HistoryExtension} from '@lexical/history';
import {
  $createLinkNode,
  ClickableLinkExtension,
  LinkExtension,
} from '@lexical/link';
import {
  $createListItemNode,
  $createListNode,
  CheckListExtension,
  ListExtension,
} from '@lexical/list';
import {PlainTextExtension} from '@lexical/plain-text';
import {LexicalCollaboration} from '@lexical/react/LexicalCollaborationContext';
import {
  CollaborationPlugin,
  CollaborationPluginV2__EXPERIMENTAL,
} from '@lexical/react/LexicalCollaborationPlugin';
import {LexicalExtensionComposer} from '@lexical/react/LexicalExtensionComposer';
import {
  $createHeadingNode,
  $createQuoteNode,
  RichTextExtension,
} from '@lexical/rich-text';
import {TableExtension} from '@lexical/table';
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/react';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  configExtension,
  defineExtension,
} from 'lexical';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {$generateHtmlFromNodes} from '@lexical/html';
import {$convertToMarkdownString} from '@lexical/markdown';
import {PLAYGROUND_TRANSFORMERS} from './plugins/MarkdownTransformers';
import {type JSX, useMemo} from 'react';
import {Doc} from 'yjs';

import {isDevPlayground} from './appSettings';
import {
  createWebsocketProvider,
  createWebsocketProviderWithDoc,
} from './collaboration';
import {FlashMessageContext} from './context/FlashMessageContext';
import {SettingsContext, useSettings} from './context/SettingsContext';
import {ToolbarContext} from './context/ToolbarContext';
import Editor from './Editor';
import {registerSettingsSynchronization} from './hooks/useSynchronizeSettings';
import {KeywordsExtension} from './nodes/KeywordNode';
import {PlaygroundImportExtension} from './nodes/PlaygroundImportExtension';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import {PlaygroundDOMRenderExtension} from './PlaygroundDOMRenderExtension';
import {AutocompleteExtension} from './plugins/AutocompleteExtension';
import {PlaygroundAutoLinkExtension} from './plugins/AutoLinkExtension';
import {CardExtension} from './plugins/CardExtension';
import {CodeHighlightExtension} from './plugins/CodeHighlightExtension';
import {CollapsibleExtension} from './plugins/CollapsibleExtension';
import {DateTimeExtension} from './plugins/DateTimeExtension';
import DocsPlugin from './plugins/DocsPlugin';
import {DragDropPasteExtension} from './plugins/DragDropPasteExtension';
import {EmojisExtension} from './plugins/EmojisExtension';
import {EquationsExtension} from './plugins/EquationsExtension';
import {ExcalidrawExtension} from './plugins/ExcalidrawExtension';
import {FigmaExtension} from './plugins/FigmaExtension';
import {ReactFindReplaceExtension} from './plugins/FindReplaceExtension';
import {ImagesExtension} from './plugins/ImagesExtension';
import {LayoutExtension} from './plugins/LayoutExtension/LayoutExtension';
import {PlaygroundMarkdownShortcutsExtension} from './plugins/MarkdownShortcutsExtension';
import {MaxLengthExtension} from './plugins/MaxLengthPlugin';
import {MentionsExtension} from './plugins/MentionsExtension';
import {PageBreakExtension} from './plugins/PageBreakExtension';
import {PagesReactExtension} from './plugins/PagesReactExtension';
import PasteLogPlugin from './plugins/PasteLogPlugin';
import {PollExtension} from './plugins/PollExtension';
import {PullQuoteExtension} from './plugins/PullQuoteExtension';
import {ReactReviewExtension} from './plugins/ReviewExtension';
import {RubyExtension} from './plugins/RubyExtension';
import {SpecialTextExtension} from './plugins/SpecialTextExtension';
import {TabFocusExtension} from './plugins/TabFocusExtension';
import {TerseExportExtension} from './plugins/TerseExportExtension';
import TestRecorderPlugin from './plugins/TestRecorderPlugin';
import {TwitterExtension} from './plugins/TwitterExtension';
import TypingPerfPlugin from './plugins/TypingPerfPlugin';
import {VersionsPlugin} from './plugins/VersionsPlugin';
import {VisibleNonPrintingExtension} from './plugins/VisibleNonPrintingExtension';
import {YouTubeExtension} from './plugins/YouTubeExtension';
import Settings from './Settings';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import ShadowDomWrapper from './ui/ShadowDomWrapper';
import {validateUrl} from './utils/url';

console.warn(
  'If you are profiling the playground app, please ensure you turn off the debug view. You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting.',
);

const COLLAB_DOC_ID = 'main';

const skipCollaborationInit =
  // @ts-expect-error
  window.parent != null && window.parent.frames.right === window;

function $prepopulatedRichText() {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const heading = $createHeadingNode('h1');
    heading.append($createTextNode('Welcome to the playground'));
    root.append(heading);
    const quote = $createQuoteNode();
    quote.append(
      $createTextNode(
        `In case you were wondering what the black box at the bottom is – it's the debug view, showing the current state of the editor. ` +
          `You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting.`,
      ),
    );
    root.append(quote);
    const paragraph = $createParagraphNode();
    paragraph.append(
      $createTextNode('The playground is a demo environment built with '),
      $createTextNode('@lexical/react').toggleFormat('code'),
      $createTextNode('.'),
      $createTextNode(' Try typing in '),
      $createTextNode('some text').toggleFormat('bold'),
      $createTextNode(' with '),
      $createTextNode('different').toggleFormat('italic'),
      $createTextNode(' formats.'),
    );
    root.append(paragraph);
    const paragraph2 = $createParagraphNode();
    paragraph2.append(
      $createTextNode(
        'Make sure to check out the various plugins in the toolbar. You can also use #hashtags or @-mentions too!',
      ),
    );
    root.append(paragraph2);
    const paragraph3 = $createParagraphNode();
    paragraph3.append(
      $createTextNode(`If you'd like to find out more about Lexical, you can:`),
    );
    root.append(paragraph3);
    const list = $createListNode('bullet');
    list.append(
      $createListItemNode().append(
        $createTextNode(`Visit the `),
        $createLinkNode('https://lexical.dev/').append(
          $createTextNode('Lexical website'),
        ),
        $createTextNode(` for documentation and more information.`),
      ),
      $createListItemNode().append(
        $createTextNode(`Check out the code on our `),
        $createLinkNode('https://github.com/facebook/lexical').append(
          $createTextNode('GitHub repository'),
        ),
        $createTextNode(`.`),
      ),
      $createListItemNode().append(
        $createTextNode(`Playground code can be found `),
        $createLinkNode(
          'https://github.com/facebook/lexical/tree/main/packages/lexical-playground',
        ).append($createTextNode('here')),
        $createTextNode(`.`),
      ),
      $createListItemNode().append(
        $createTextNode(`Join our `),
        $createLinkNode('https://discord.com/invite/KmG4wQnnD9').append(
          $createTextNode('Discord Server'),
        ),
        $createTextNode(` and chat with the team.`),
      ),
    );
    root.append(list);
    const paragraph4 = $createParagraphNode();
    paragraph4.append(
      $createTextNode(
        `Lastly, we're constantly adding cool new features to this playground. So make sure you check back here when you next get a chance :).`,
      ),
    );
    root.append(paragraph4);
  }
}

// These are only enabled for rich-text mode
const PlaygroundRichTextExtension = /* @__PURE__ */ defineExtension({
  dependencies: [
    /* @__PURE__ */ configExtension(RichTextExtension, {
      escapeFormatTriggers: {
        code: {arrow: true, click: true, enter: true, onlyAtBoundary: true},
      },
    }),
    // Each node extension below registers its own DOM-import rules — the
    // framework nodes (rich-text, list, table, code) and the playground block
    // hosts (Card, PullQuote, Review) alike — so the rich-text importer set
    // tracks this node set automatically (kept out of the always-on
    // PlaygroundImportExtension so plain-text mode doesn't pull in
    // RichTextExtension, which conflicts with PlainTextExtension).
    /* @__PURE__ */ configExtension(TableExtension, {
      hasStickyScrollbar: true,
    }),
    ImagesExtension,
    HorizontalRuleExtension,
    PageBreakExtension,
    TwitterExtension,
    YouTubeExtension,
    FigmaExtension,
    TabFocusExtension,
    CollapsibleExtension,
    CodeHighlightExtension,
    /* @__PURE__ */ configExtension(ListExtension, {
      shouldPreserveNumbering: false,
    }),
    CheckListExtension,
    PlaygroundMarkdownShortcutsExtension,
    PageBreakExtension,
    PagesReactExtension,
    PollExtension,
    EquationsExtension,
    LayoutExtension,
    ExcalidrawExtension,
    CardExtension,
    ReactReviewExtension,
    ReactFindReplaceExtension,
    PullQuoteExtension,
    RubyExtension,
    /* @__PURE__ */ configExtension(TabIndentationExtension, {maxIndent: 7}),
  ],
  name: '@lexical/playground/RichText',
});

const AppExtension = /* @__PURE__ */ defineExtension({
  dependencies: [
    AutoFocusExtension,
    ClearEditorExtension,
    DecoratorTextExtension,
    // Exposes editor.isEditable() as a signal; consumed by
    // registerSettingsSynchronization to drive ClickableLinkExtension.
    WatchEditableExtension,
    HistoryExtension,
    HistoryAnnounceExtension,
    EditorModeAnnounceExtension,
    KeywordsExtension,
    HashtagExtension,
    DateTimeExtension,
    MaxLengthExtension,
    SpecialTextExtension,
    DragDropPasteExtension,
    EmojisExtension,
    MentionsExtension,
    /* @__PURE__ */ configExtension(LinkExtension, {validateUrl}),
    PlaygroundAutoLinkExtension,
    /* @__PURE__ */ configExtension(ClickableLinkExtension, {newTab: true}),
    SelectionAlwaysOnDisplayExtension,
    /* @__PURE__ */ configExtension(SelectBlockExtension, {
      cascadeSelection: true,
    }),
    TerseExportExtension,
    /* @__PURE__ */ configExtension(ClickAfterLastBlockExtension, {
      $shouldInsertAfter: node =>
        $defaultShouldInsertAfter(node) || $isCodeNode(node),
    }),
    /* @__PURE__ */ configExtension(AutocompleteExtension, {disabled: true}),
    /* @__PURE__ */ configExtension(VisibleNonPrintingExtension, {
      disabled: true,
    }),
    // DOMImportExtension pipeline — `PlaygroundImportExtension` bundles
    // the shared `CoreImportExtension` baseline, the playground-specific
    // inline-style overlay and the `ClipboardDOMImportExtension` paste
    // handler. Per-node import rules ride along with each node extension.
    PlaygroundImportExtension,
    // Replaces the legacy `buildHTMLConfig().export` overrides.
    PlaygroundDOMRenderExtension,
    FocusTrapExtension,
    RovingTabIndexExtension,
    FocusManagerExtension,
  ],
  name: '@lexical/playground',
  namespace: 'Playground',
  nodes: PlaygroundNodes,
  theme: PlaygroundEditorTheme,
});

/**
 * The *only* settings that require tearing down and rebuilding the editor,
 * because they change the set of extensions in use (and therefore the initial
 * editor state). Building a dynamic extension from settings at all is an
 * anti-pattern — extensions should be as static as possible — and is tolerated
 * here only because the playground builds fundamentally different editors from
 * the query string.
 *
 * IMPORTANT: Do NOT add a setting here unless changing it genuinely requires a
 * different extension graph. Anything a live editor can react to through an
 * extension's config signals — table behavior toggles, link attributes,
 * character limits, autocomplete, etc. — MUST instead be synced with
 * `useSyncExtensionSignal` in `Editor.tsx`. Adding such a setting here forces a
 * full editor rebuild (discarding content, selection, and history) on every
 * toggle, which is exactly the bug that moving the table settings out of here
 * fixed.
 */
interface DynamicSettings {
  isCollab: boolean;
  emptyEditor: boolean;
  isRichText: boolean;
}

function buildExtensionFromSettings(settings: DynamicSettings) {
  const {isCollab, emptyEditor, isRichText} = settings;
  return defineExtension({
    $initialEditorState: isCollab
      ? null
      : emptyEditor
        ? undefined
        : $prepopulatedRichText,
    dependencies: [
      AppExtension,
      /* @__PURE__ */ configExtension(HistoryExtension, {disabled: isCollab}),
      isRichText ? PlaygroundRichTextExtension : PlainTextExtension,
    ],
    name: '@lexical/playground/dynamic-config',
    // Apply INITIAL_SETTINGS to the extension config signals synchronously as
    // the editor is built (and wire the editable→clickable-link signal),
    // before the React useSynchronizeSettings effect takes over live updates.
    register: registerSettingsSynchronization,
  });
}

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$generateNodesFromDOM} from '@lexical/html';
import {useEffect, useState} from 'react';

import {$convertFromMarkdownString} from '@lexical/markdown';
import {PLAYGROUND_TRANSFORMERS} from './plugins/MarkdownTransformers';

function InitialValuePlugin({ value }: { value?: string }) {
  const [editor] = useLexicalComposerContext();
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (isFirstRender && value) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        // Very basic heuristic: if it starts with <, treat as HTML, else MD
        if (value.trim().startsWith('<')) {
          const parser = new DOMParser();
          const dom = parser.parseFromString(value, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          root.append(...nodes);
        } else {
          $convertFromMarkdownString(value, PLAYGROUND_TRANSFORMERS);
        }
      });
      setIsFirstRender(false);
    }
  }, [editor, isFirstRender, value]);

  return null;
}

function App({ value, onChange, onChangeMarkdown }: { value?: string, onChange?: (html: string) => void, onChangeMarkdown?: (md: string) => void }): JSX.Element {
  const {
    settings: {
      isCollab,
      useCollabV2,
      emptyEditor,
      isRichText,
      isShadowDOM,
      measureTypingPerf,
    },
  } = useSettings();

  const app = useMemo(
    () => buildExtensionFromSettings({emptyEditor, isCollab, isRichText}),
    [emptyEditor, isCollab, isRichText],
  );

  return (
    <LexicalCollaboration>
      <LexicalExtensionComposer extension={app} contentEditable={null}>
        <InitialValuePlugin value={value} />
        <ToolbarContext>
          {isRichText && isCollab ? (
            useCollabV2 ? (
              <CollabV2
                id={COLLAB_DOC_ID}
                shouldBootstrap={!skipCollaborationInit}
              />
            ) : (
              <CollaborationPlugin
                id={COLLAB_DOC_ID}
                providerFactory={createWebsocketProvider}
                shouldBootstrap={!skipCollaborationInit}
                selectionHighlight={true}
              />
            )
          ) : null}
          {isShadowDOM ? (
            <ShadowDomWrapper>
              <div className="editor-shell">
                <Editor />
              </div>
            </ShadowDomWrapper>
          ) : (
            <div className="editor-shell">
              <Editor />
            </div>
          )}
          {measureTypingPerf ? <TypingPerfPlugin /> : null}
          {(onChange || onChangeMarkdown) ? <OnChangePlugin onChange={(editorState, editor) => {
            editorState.read(() => {
              if (onChange) {
                const html = $generateHtmlFromNodes(editor, null);
                onChange(html);
              }
              if (onChangeMarkdown) {
                const markdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
                onChangeMarkdown(markdown);
              }
            });
          }} /> : null}
        </ToolbarContext>
      </LexicalExtensionComposer>
    </LexicalCollaboration>
  );
}

function CollabV2({
  id,
  shouldBootstrap,
}: {
  id: string;
  shouldBootstrap: boolean;
}) {
  // VersionsPlugin needs GC disabled.
  const doc = useMemo(() => new Doc({gc: false}), []);

  const provider = useMemo(() => {
    return createWebsocketProviderWithDoc('main', doc);
  }, [doc]);

  return (
    <>
      <CollaborationPluginV2__EXPERIMENTAL
        id={id}
        doc={doc}
        provider={provider}
        __shouldBootstrapUnsafe={shouldBootstrap}
        selectionHighlight={true}
      />
      <VersionsPlugin id={id} />
    </>
  );
}

export default function PlaygroundApp({ value, onChange, onChangeMarkdown }: { value?: string, onChange?: (html: string) => void, onChangeMarkdown?: (md: string) => void }): JSX.Element {
  return (
    <SettingsContext>
      <FlashMessageContext>
        <App value={value} onChange={onChange} onChangeMarkdown={onChangeMarkdown} />
      </FlashMessageContext>
    </SettingsContext>
  );
}
