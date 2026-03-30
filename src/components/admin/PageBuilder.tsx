'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Type,
    Image as ImageIcon,
    Minus,
    MousePointer2,
    Save,
    Trash2,
    ChevronLeft,
    GripVertical,
    Plus,
    Monitor,
    Smartphone,
    Tablet,
    Eye,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Loader2,
    Columns,
    Columns2,
    LayoutTemplate,
    RotateCw,
    List,
    Bold,
    Italic,
    Underline,
    Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────
const BLOCK_TYPES = {
    TEXT: 'text',
    HEADING: 'heading',
    IMAGE: 'image',
    BUTTON: 'button',
    DIVIDER: 'divider',
    SPACER: 'spacer',
    COLUMNS: 'columns',
    LIST: 'list',
};

// Column layout presets: each number is the flex ratio for that column
const COLUMN_LAYOUTS = {
    '1-1': { label: '50% / 50%', ratios: [1, 1] },
    '1-1-1': { label: '33% / 33% / 33%', ratios: [1, 1, 1] },
    '2-1': { label: '66% / 33%', ratios: [2, 1] },
    '1-2': { label: '33% / 66%', ratios: [1, 2] },
    '1-1-1-1': { label: '25% x 4', ratios: [1, 1, 1, 1] },
};

const PALETTE_COLORS = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#FFFFFF',
    '#00c3c0', '#0EA5E9', '#6366F1', '#8B5CF6', '#EC4899',
    '#ff8602', '#F59E0B', '#10B981', '#EF4444', '#F43F5E',
];

const defaultBlockStyles = {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 24,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    backgroundColor: '#FFFFFF',
    color: '#1e293b',
    fontSize: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
    textTransform: 'none',
    textAlign: 'left',
    borderRadius: 0,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    bulletColor: '#00c3c0',
    buttonPaddingX: 28,
    buttonPaddingY: 10,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
    paragraphSpacing: 16,
    paragraphPadding: 0,
    listItemSpacing: 0,
    h2FontSize: 28,
    h2Color: '#1e293b',
    h2FontWeight: 700,
    h2TextAlign: 'left',
    h2LineHeight: 1.2,
    h2LetterSpacing: 0,
    h2TextTransform: 'none',
    h2FontStyle: 'normal',
    h2TextDecoration: 'none',
    h2MarginBottom: 16,
};

function newBlock(type, extra = {}) {
    const id = Math.random().toString(36).slice(2, 10);
    const base = { id, type, styles: { ...defaultBlockStyles } };
    switch (type) {
        case BLOCK_TYPES.TEXT:
            return { ...base, content: '<p>Click here to edit this text block.</p>' };
        case BLOCK_TYPES.HEADING:
            return { ...base, content: '<h2>Section Heading</h2>', styles: { ...defaultBlockStyles, h2FontSize: 28, h2FontWeight: 700 } };
        case BLOCK_TYPES.IMAGE:
            return { ...base, src: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&q=80&w=1170', alt: 'Page image', styles: { ...defaultBlockStyles, paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 } };
        case BLOCK_TYPES.BUTTON:
            return { ...base, text: 'Click Here', url: '#', target: '_self', styles: { ...defaultBlockStyles, paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0, backgroundColor: '#00c3c0', color: '#FFFFFF', textAlign: 'center', borderRadius: 12 } };
        case BLOCK_TYPES.DIVIDER:
            return { ...base, styles: { ...defaultBlockStyles, paddingTop: 8, paddingBottom: 8 } };
        case BLOCK_TYPES.SPACER:
            return { ...base, height: 40 };
        case BLOCK_TYPES.LIST:
            return { ...base, content: '<ul style="margin: 0; padding-left: 20px;"><li>Item 1</li><li>Item 2</li></ul>' };
        case BLOCK_TYPES.COLUMNS: {
            const layoutKey = extra.layoutKey || '1-1';
            const ratios = COLUMN_LAYOUTS[layoutKey]?.ratios || [1, 1];
            return {
                ...base,
                layoutKey,
                styles: { ...defaultBlockStyles, paddingLeft: 8, paddingRight: 8, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FFFFFF' },
                columns: ratios.map((ratio) => ({
                    id: Math.random().toString(36).slice(2, 10),
                    ratio,
                    blocks: [],
                })),
            };
        }
        default:
            return base;
    }
}

// ─────────────────────────────────────────
//  Column Cell – drop zone for child blocks
// ─────────────────────────────────────────
function ColumnCell({ column, colIndex, parentBlockId, selectedId, onSelect, onDeleteChild, onUpdateChild, onAddBlockToColumn, updateBlockContent, isMobile }) {
    return (
        <div
            style={{ flex: isMobile ? '1 1 100%' : column.ratio }}
            className="min-h-[80px] border-2 border-dashed border-slate-200 rounded-xl p-2 flex flex-col gap-2 relative group/col"
        >
            {column.blocks.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-[9px] font-bold uppercase tracking-widest text-slate-300 select-none pointer-events-none">
                    Drop here
                </div>
            )}

            {column.blocks.map((childBlock) => (
                <div
                    key={childBlock.id}
                    onClick={(e) => { e.stopPropagation(); onSelect(childBlock.id); }}
                    className={`relative rounded-lg border-2 transition-all cursor-pointer group/child ${selectedId === childBlock.id ? 'border-[#00c3c0] ring-4 ring-[#00c3c0]/10' : 'border-transparent hover:border-slate-200'}`}
                >
                    {selectedId === childBlock.id && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteChild(parentBlockId, colIndex, childBlock.id); }}
                            className="absolute -right-3 -top-3 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <BlockRenderer block={childBlock} onUpdateContent={updateBlockContent} />
                </div>
            ))}

            <div className="opacity-0 group-hover/col:opacity-100 transition-opacity flex justify-center mt-1">
                <QuickAddMenu onAdd={(type) => onAddBlockToColumn(parentBlockId, colIndex, type)} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────
//  Quick add dropdown for columns
// ─────────────────────────────────────────
const QUICK_ADD_TYPES = [
    { type: BLOCK_TYPES.TEXT, label: 'Text' },
    { type: BLOCK_TYPES.HEADING, label: 'Heading' },
    { type: BLOCK_TYPES.IMAGE, label: 'Image' },
    { type: BLOCK_TYPES.BUTTON, label: 'Button' },
    { type: BLOCK_TYPES.DIVIDER, label: 'Divider' },
    { type: BLOCK_TYPES.SPACER, label: 'Spacer' },
];

function QuickAddMenu({ onAdd }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#00c3c0]/10 hover:bg-[#00c3c0]/20 text-[#00c3c0] border border-[#00c3c0]/30 transition-all"
                title="Add block to column"
            >
                <Plus className="w-3.5 h-3.5" />
            </button>
            {open && (
                <div
                    className="absolute z-50 bottom-9 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 flex flex-col gap-1 min-w-[110px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {QUICK_ADD_TYPES.map(({ type, label }) => (
                        <button
                            key={type}
                            onClick={() => { onAdd(type); setOpen(false); }}
                            className="text-left text-[11px] font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────
//  Sortable Block (top-level)
// ─────────────────────────────────────────
function SortableBlock({ block, isSelected, onSelect, onDelete, selectedId, onDeleteChild, onUpdateChild, onAddBlockToColumn, updateBlockContent, viewMode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

    if (block.type === BLOCK_TYPES.COLUMNS) {
        return (
            <div ref={setNodeRef} style={style} onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
                className={`group relative rounded-xl transition-all border-2 ${isSelected ? 'border-[#00c3c0] ring-4 ring-[#00c3c0]/10' : 'border-transparent hover:border-slate-200'}`}>
                <div {...attributes} {...listeners}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1.5 text-slate-300 hover:text-slate-500 transition-opacity">
                    <GripVertical className="w-4 h-4" />
                </div>
                {isSelected && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
                        className="absolute -right-3 -top-3 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}

                <div className="absolute -top-3 left-2 z-10">
                    <span className="text-[8px] font-black uppercase tracking-widest bg-[#6366F1] text-white px-2 py-0.5 rounded-full">
                        {COLUMN_LAYOUTS[block.layoutKey]?.label || 'Columns'}
                    </span>
                </div>

                <div
                    style={{
                        paddingTop: block.styles?.paddingTop,
                        paddingBottom: block.styles?.paddingBottom,
                        paddingLeft: block.styles?.paddingLeft,
                        paddingRight: block.styles?.paddingRight,
                        marginTop: block.styles?.marginTop,
                        marginBottom: block.styles?.marginBottom,
                        marginLeft: block.styles?.marginLeft,
                        marginRight: block.styles?.marginRight,
                        backgroundColor: block.styles?.backgroundColor,
                        borderRadius: block.styles?.borderRadius,
                        borderTopWidth: `${block.styles?.borderTopWidth || 0}px`,
                        borderBottomWidth: `${block.styles?.borderBottomWidth || 0}px`,
                        borderLeftWidth: `${block.styles?.borderLeftWidth || 0}px`,
                        borderRightWidth: `${block.styles?.borderRightWidth || 0}px`,
                        borderColor: block.styles?.borderColor || '#e2e8f0',
                        borderStyle: block.styles?.borderStyle || 'solid',
                    }}
                    className={`mt-2 gap-2 ${viewMode === 'mobile' ? 'flex flex-col' : 'flex'}`}
                >
                    {block.columns.map((col, colIdx) => (
                        <ColumnCell
                            key={col.id}
                            column={col}
                            colIndex={colIdx}
                            parentBlockId={block.id}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onDeleteChild={onDeleteChild}
                            onUpdateChild={onUpdateChild}
                            onAddBlockToColumn={onAddBlockToColumn}
                            updateBlockContent={updateBlockContent}
                            isMobile={viewMode === 'mobile'}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
            className={`group relative rounded-lg transition-all border-2 ${isSelected ? 'border-[#00c3c0] ring-4 ring-[#00c3c0]/10' : 'border-transparent hover:border-slate-200'}`}>
            <div {...attributes} {...listeners}
                className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1.5 text-slate-300 hover:text-slate-500 transition-opacity">
                <GripVertical className="w-4 h-4" />
            </div>
            {isSelected && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
                    className="absolute -right-3 -top-3 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
            <BlockRenderer block={block} onUpdateContent={updateBlockContent} />
        </div>
    );
}

// ─────────────────────────────────────────
//  Block Renderer (Canvas preview)
// ─────────────────────────────────────────
function BlockRenderer({ block, onUpdateContent }) {
    const s = block.styles || {};
    const containerStyle = {
        paddingTop: s.paddingTop, paddingBottom: s.paddingBottom,
        paddingLeft: s.paddingLeft, paddingRight: s.paddingRight,
        marginTop: s.marginTop, marginBottom: s.marginBottom,
        marginLeft: s.marginLeft, marginRight: s.marginRight,
        backgroundColor: s.backgroundColor,
        borderRadius: s.borderRadius,
        borderTopWidth: `${s.borderTopWidth || 0}px`,
        borderBottomWidth: `${s.borderBottomWidth || 0}px`,
        borderLeftWidth: `${s.borderLeftWidth || 0}px`,
        borderRightWidth: `${s.borderRightWidth || 0}px`,
        borderColor: s.borderColor || '#e2e8f0',
        borderStyle: s.borderStyle || 'solid',
    };
    const textStyle = {
        color: s.color,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight || 1.5,
        letterSpacing: `${s.letterSpacing || 0}px`,
        textTransform: s.textTransform || 'none',
        textAlign: s.textAlign,
        fontWeight: s.fontWeight || 'normal',
        fontStyle: s.fontStyle || 'normal',
        textDecoration: s.textDecoration || 'none',
    };
    const contentRef = useRef(null);

    useEffect(() => {
        if (contentRef.current && contentRef.current.innerHTML !== block.content) {
            contentRef.current.innerHTML = block.content;
        }
    }, [block.content]);

    switch (block.type) {
        case BLOCK_TYPES.TEXT:
        case BLOCK_TYPES.HEADING:
        case BLOCK_TYPES.LIST:
            return (
                <div style={containerStyle} className="page-block-renderer">
                    {block.type === BLOCK_TYPES.LIST && (
                        <style dangerouslySetInnerHTML={{
                            __html: `
                                #block-${block.id} li::marker { color: ${s.bulletColor || s.color || '#00c3c0'} !important; }
                                #block-${block.id} li { margin-bottom: ${s.listItemSpacing ?? 0}px !important; }
                                #block-${block.id} li:last-child { margin-bottom: 0 !important; }
                                #block-${block.id} ul, #block-${block.id} ol {
                                    list-style-position: inside !important;
                                    padding-left: 0 !important;
                                    margin: 0 !important;
                                    text-align: ${s.textAlign || 'left'} !important;
                                }
                                #block-${block.id} li {
                                    text-align: ${s.textAlign || 'left'} !important;
                                    display: list-item !important;
                                }
                            `
                        }} />
                    )}
                    <style dangerouslySetInnerHTML={{
                        __html: `#block-${block.id} p { margin-bottom: ${s.paragraphSpacing ?? 16}px !important; padding: ${s.paragraphPadding ?? 0}px !important; margin-top: 0 !important; } #block-${block.id} p:last-child { margin-bottom: 0 !important; }`
                    }} />
                    {block.type === BLOCK_TYPES.HEADING && (
                        <style dangerouslySetInnerHTML={{
                            __html: `
                                #block-${block.id} h2 {
                                    font-size: ${s.h2FontSize ?? 28}px !important;
                                    color: ${s.h2Color ?? '#1e293b'} !important;
                                    font-weight: ${s.h2FontWeight ?? 700} !important;
                                    text-align: ${s.h2TextAlign ?? 'left'} !important;
                                    line-height: ${s.h2LineHeight ?? 1.2} !important;
                                    letter-spacing: ${s.h2LetterSpacing ?? 0}px !important;
                                    text-transform: ${s.h2TextTransform ?? 'none'} !important;
                                    font-style: ${s.h2FontStyle ?? 'normal'} !important;
                                    text-decoration: ${s.h2TextDecoration ?? 'none'} !important;
                                    margin-bottom: ${s.h2MarginBottom ?? 0}px !important;
                                    margin-top: 0 !important;
                                }
                            `
                        }} />
                    )}
                    <div className="relative group/text-content">
                        <div className="absolute -top-12 left-0 z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 hidden group-focus-within/text-content:flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2">
                            {[
                                { label: 'Bold', icon: Bold, cmd: 'bold' },
                                { label: 'Italic', icon: Italic, cmd: 'italic' },
                                { label: 'Underline', icon: Underline, cmd: 'underline' },
                            ].map(({ label, icon: Icon, cmd }) => (
                                <button
                                    key={cmd}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        document.execCommand(cmd, false, null);
                                    }}
                                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-[#00c3c0] transition-colors"
                                    title={label}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                </button>
                            ))}
                            <div className="w-px h-4 bg-slate-100 mx-1" />
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    document.execCommand('removeFormat', false, null);
                                }}
                                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                                title="Clear Formatting"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div
                            id={`block-${block.id}`}
                            ref={contentRef}
                            style={textStyle}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                const newHTML = e.currentTarget.innerHTML;
                                if (newHTML !== block.content) {
                                    onUpdateContent(block.id, newHTML);
                                }
                            }}
                            onPaste={(e) => {
                                e.preventDefault();
                                const text = e.clipboardData.getData('text/plain');
                                document.execCommand('insertText', false, text);
                            }}
                            className="prose prose-slate max-w-none outline-none focus:ring-2 focus:ring-[#00c3c0]/10 rounded px-1 transition-all"
                        />
                    </div>
                </div>
            );
        case BLOCK_TYPES.IMAGE:
            return (
                <div style={containerStyle} className="page-block-renderer">
                    <img src={block.src} alt={block.alt} className="w-full object-cover" style={{ borderRadius: s.borderRadius }} />
                </div>
            );
        case BLOCK_TYPES.BUTTON:
            return (
                <div style={{
                    paddingTop: s.paddingTop, paddingBottom: s.paddingBottom,
                    paddingLeft: s.paddingLeft, paddingRight: s.paddingRight,
                    borderTopWidth: `${s.borderTopWidth || 0}px`,
                    borderBottomWidth: `${s.borderBottomWidth || 0}px`,
                    borderLeftWidth: `${s.borderLeftWidth || 0}px`,
                    borderRightWidth: `${s.borderRightWidth || 0}px`,
                    borderColor: s.borderColor || '#e2e8f0',
                    borderStyle: s.borderStyle || 'solid',
                    display: 'flex',
                    justifyContent: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'flex-end' : 'flex-start',
                }} className="page-block-renderer">
                    <a
                        href={block.url}
                        target={block.target || '_self'}
                        onClick={(e) => e.preventDefault()}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                            const newText = e.currentTarget.innerText;
                            if (newText !== block.text) {
                                onUpdateContent(block.id, newText, 'text');
                            }
                        }}
                        onPaste={(e) => {
                            e.preventDefault();
                            const text = e.clipboardData.getData('text/plain');
                            document.execCommand('insertText', false, text);
                        }}
                        className="outline-none focus:ring-2 focus:ring-white/50 px-1 rounded transition-all"
                        style={{
                            backgroundColor: s.backgroundColor,
                            color: s.color,
                            borderRadius: s.borderRadius,
                            fontSize: s.fontSize,
                            padding: `${s.buttonPaddingY || 10}px ${s.buttonPaddingX || 28}px`,
                            display: 'inline-block',
                            fontWeight: 700,
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {block.text}
                    </a>
                </div>
            );
        case BLOCK_TYPES.DIVIDER:
            return (
                <div style={containerStyle} className="page-block-renderer">
                    <hr style={{ borderColor: s.color || '#e2e8f0' }} />
                </div>
            );
        case BLOCK_TYPES.SPACER:
            return <div style={{ height: block.height || 40, backgroundColor: 'transparent' }} className="border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 text-xs font-mono page-block-renderer">spacer · {block.height || 40}px</div>;
        default:
            return null;
    }
}

// ─────────────────────────────────────────
//  HTML Export utility
// ─────────────────────────────────────────
function blockToHTML(block) {
    const s = block.styles || {};
    const marginCSS = `margin:${s.marginTop || 0}px ${s.marginRight || 0}px ${s.marginBottom || 0}px ${s.marginLeft || 0}px;`;
    const borderCSS = `border-top-width:${s.borderTopWidth || 0}px;border-bottom-width:${s.borderBottomWidth || 0}px;border-left-width:${s.borderLeftWidth || 0}px;border-right-width:${s.borderRightWidth || 0}px;border-color:${s.borderColor || '#e2e8f0'};border-style:${s.borderStyle || 'solid'};`;
    const wrap = (inner) => `<div style="padding:${s.paddingTop}px ${s.paddingRight}px ${s.paddingBottom}px ${s.paddingLeft}px;background-color:${s.backgroundColor};border-radius:${s.borderRadius}px;box-sizing:border-box;${marginCSS}${borderCSS}">${inner}</div>`;

    switch (block.type) {
        case BLOCK_TYPES.TEXT:
        case BLOCK_TYPES.HEADING:
        case BLOCK_TYPES.LIST: {
            const extraStyles = [
                block.type === BLOCK_TYPES.LIST ? `#blk-${block.id} li::marker { color: ${s.bulletColor || s.color || '#00c3c0'}; }` : '',
                `#blk-${block.id} p { margin-bottom: ${s.paragraphSpacing ?? 16}px; padding: ${s.paragraphPadding ?? 0}px; margin-top: 0; }`,
                `#blk-${block.id} p:last-child { margin-bottom: 0; }`,
                `#blk-${block.id} ul, #blk-${block.id} ol { list-style-position: inside; padding-left: 0; margin: 0; text-align: ${s.textAlign || 'left'}; }`,
                `#blk-${block.id} li { text-align: ${s.textAlign || 'left'}; margin-bottom: ${s.listItemSpacing ?? 0}px !important; }`,
                `#blk-${block.id} li:last-child { margin-bottom: 0 !important; }`,
                block.type === BLOCK_TYPES.HEADING ? `
                    #blk-${block.id} h2 {
                        font-size: ${s.h2FontSize ?? 28}px;
                        color: ${s.h2Color ?? '#1e293b'};
                        font-weight: ${s.h2FontWeight ?? 700};
                        text-align: ${s.h2TextAlign ?? 'left'};
                        line-height: ${s.h2LineHeight ?? 1.2};
                        letter-spacing: ${s.h2LetterSpacing ?? 0}px;
                        text-transform: ${s.h2TextTransform ?? 'none'};
                        font-style: ${s.h2FontStyle ?? 'normal'};
                        text-decoration: ${s.h2TextDecoration ?? 'none'};
                        margin-bottom: ${s.h2MarginBottom ?? 16}px;
                        margin-top: 0;
                    }
                ` : ''
            ].join(' ');
            const listIdAttr = `id="blk-${block.id}"`;
            const content = `<style>${extraStyles}</style><div ${listIdAttr} style="color:${s.color};font-size:${s.fontSize}px;line-height:${s.lineHeight || 1.5};letter-spacing:${s.letterSpacing || 0}px;text-transform:${s.textTransform || 'none'};text-align:${s.textAlign};font-weight:${s.fontWeight || 'normal'};font-style:${s.fontStyle || 'normal'};text-decoration:${s.textDecoration || 'none'};">${block.content}</div>`;
            return wrap(content);
        }
        case BLOCK_TYPES.IMAGE:
            return wrap(`<img src="${block.src}" alt="${block.alt}" style="width:100%;display:block;" />`);
        case BLOCK_TYPES.BUTTON:
            return `<div style="padding:${s.paddingTop}px ${s.paddingRight}px ${s.paddingBottom}px ${s.paddingLeft}px;text-align:${s.textAlign};box-sizing:border-box;${marginCSS}${borderCSS}"><a href="${block.url}" target="${block.target || '_self'}" style="background-color:${s.backgroundColor};color:${s.color};border-radius:${s.borderRadius}px;font-size:${s.fontSize}px;padding:${s.buttonPaddingY || 10}px ${s.buttonPaddingX || 28}px;display:inline-block;font-weight:700;text-decoration:none;white-space:nowrap;">${block.text}</a></div>`;
        case BLOCK_TYPES.DIVIDER:
            return wrap(`<hr style="border:none;border-top:1px solid ${s.color || '#e2e8f0'};" />`);
        case BLOCK_TYPES.SPACER:
            return `<div style="height:${block.height || 40}px;"></div>`;
        case BLOCK_TYPES.COLUMNS: {
            const totalRatio = block.columns.reduce((a, c) => a + c.ratio, 0);
            const colHTMLs = block.columns.map((col) => {
                const pct = Math.round((col.ratio / totalRatio) * 100);
                const childHTML = col.blocks.map(blockToHTML).join('');
                return `<td class="col-block" valign="top" style="width:${pct}%;padding:4px;">${childHTML}</td>`;
            }).join('');
            return `<div style="padding:${s.paddingTop}px ${s.paddingRight}px ${s.paddingBottom}px ${s.paddingLeft}px;background-color:${s.backgroundColor};box-sizing:border-box;${marginCSS}${borderCSS}">
<table class="col-row" width="100%" cellpadding="0" cellspacing="0"><tr>${colHTMLs}</tr></table>
</div>`;
        }
        default:
            return '';
    }
}

function generateHTML(blocks) {
    const blocksHtml = blocks.map(blockToHTML).join('\n');
    const responsiveCSS = `<style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media only screen and (max-width:600px){.col-row{width:100%!important;}.col-block{display:block!important;width:100%!important;box-sizing:border-box;}}
    </style>`;

    const designComment = `\n<!-- PAGE_BLOCKS:${JSON.stringify(blocks).replace(/--/g, '\\u002d\\u002d')} -->`;

    return `${responsiveCSS}
<div class="page-content" style="background:#fff;font-family:Arial,sans-serif;margin:0;padding:0;">
    ${blocksHtml}
</div>${designComment}`;
}

// ─────────────────────────────────────────
//  Property Panel
// ─────────────────────────────────────────
function PropertyPanel({ block, onUpdate, blocks, setBlocks }) {
    const [isUploading, setIsUploading] = useState(false);

    if (!block) {
        return (
            <div className="flex flex-col h-full min-h-0 bg-white">
                <div className="p-4 border-b flex items-center gap-2 shrink-0">
                    <MousePointer2 className="w-4 h-4 text-slate-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Properties</p>
                </div>
                <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div>
                        <MousePointer2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm text-slate-400 font-medium">Select a block to edit its properties</p>
                    </div>
                </div>
            </div>
        );
    }

    const s = block.styles || {};
    const set = (key, val) => {
        onUpdate(block.id, { styles: { ...(block.styles || {}), [key]: val } });
    };
    const setContent = (updates) => {
        onUpdate(block.id, updates);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data?.url) setContent({ src: data.url });
            else alert('Failed to get uploaded image URL.');
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload image.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-0 bg-white">
            <div className="p-4 border-b flex items-center gap-2 shrink-0">
                <MousePointer2 className="w-4 h-4 text-[#ff8602]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Properties</p>
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div className="p-5 space-y-6 text-sm">
                    <Badge className="bg-[#ff8602]/10 text-[#ff8602] border-[#ff8602]/20 uppercase text-[9px] tracking-widest px-3 py-1">
                        {block.type}
                    </Badge>

                    {block.type === BLOCK_TYPES.COLUMNS && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Column Layout</Label>
                            <div className="grid grid-cols-1 gap-1.5">
                                {Object.entries(COLUMN_LAYOUTS).map(([key, { label }]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            const ratios = COLUMN_LAYOUTS[key].ratios;
                                            onUpdate(block.id, {
                                                layoutKey: key,
                                                columns: ratios.map((ratio, i) => ({
                                                    id: block.columns[i]?.id || Math.random().toString(36).slice(2, 10),
                                                    ratio,
                                                    blocks: block.columns[i]?.blocks || [],
                                                })),
                                            });
                                        }}
                                        className={`text-left text-[10px] font-bold px-3 py-2 rounded-xl border transition-all ${block.layoutKey === key ? 'bg-[#6366F1]/10 border-[#6366F1]/30 text-[#6366F1]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <Separator />
                        </div>
                    )}

                    {(block.type === BLOCK_TYPES.TEXT || block.type === BLOCK_TYPES.HEADING || block.type === BLOCK_TYPES.LIST) && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">HTML Content</Label>
                            <textarea
                                className="w-full min-h-[120px] p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00c3c0]/20 focus:border-[#00c3c0] resize-none outline-none"
                                value={block.content}
                                onChange={(e) => setContent({ content: e.target.value })}
                            />
                        </div>
                    )}

                    {block.type === BLOCK_TYPES.IMAGE && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Image Source</Label>
                                <Input className="h-9 text-xs rounded-xl" placeholder="Paste image URL here" value={block.src} onChange={(e) => setContent({ src: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alt Text</Label>
                                <Input className="h-9 text-xs rounded-xl" value={block.alt} onChange={(e) => setContent({ alt: e.target.value })} />
                            </div>
                        </>
                    )}

                    {block.type === BLOCK_TYPES.BUTTON && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Label</Label>
                                <Input className="h-9 text-xs rounded-xl font-bold" value={block.text} onChange={(e) => setContent({ text: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">URL</Label>
                                <Input className="h-9 text-xs rounded-xl" value={block.url} onChange={(e) => setContent({ url: e.target.value })} />
                            </div>
                        </>
                    )}

                    {block.type === BLOCK_TYPES.SPACER && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Height (px)</Label>
                            <Input type="number" className="h-9 text-xs rounded-xl" value={block.height || 40} onChange={(e) => setContent({ height: Number(e.target.value) })} />
                        </div>
                    )}

                    <Separator />

                    {block.type !== BLOCK_TYPES.DIVIDER && block.type !== BLOCK_TYPES.SPACER && block.type !== BLOCK_TYPES.IMAGE && block.type !== BLOCK_TYPES.COLUMNS && block.type !== BLOCK_TYPES.HEADING && (
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Typography</Label>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400 w-20 shrink-0">Font Size</span>
                                <input type="range" min={10} max={64} value={s.fontSize || 16} onChange={(e) => set('fontSize', Number(e.target.value))} className="flex-1 accent-[#00c3c0]" />
                                <Input
                                    type="number"
                                    min={10}
                                    max={64}
                                    value={s.fontSize || 16}
                                    onChange={(e) => set('fontSize', Number(e.target.value))}
                                    className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#00c3c0]/50"
                                />
                            </div>
                            <div className="flex gap-1.5">
                                {[
                                    { align: 'left', icon: AlignLeft },
                                    { align: 'center', icon: AlignCenter },
                                    { align: 'right', icon: AlignRight },
                                ].map(({ align, icon: Icon }) => (
                                    <button key={align} onClick={() => set('textAlign', align)}
                                        className={`flex-1 h-9 flex items-center justify-center rounded-xl border transition-all ${s.textAlign === align ? 'bg-[#00c3c0]/10 border-[#00c3c0]/30 text-[#00c3c0]' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                                        <Icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Background Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {PALETTE_COLORS.map(c => (
                                <button key={c} onClick={() => set('backgroundColor', c)}
                                    style={{ backgroundColor: c }}
                                    className={`w-7 h-7 rounded-lg border-2 transition-all ${s.backgroundColor === c ? 'border-slate-800 scale-110 shadow-md' : 'border-white hover:scale-110 shadow-sm hover:shadow-md'}`} />
                            ))}
                            <input type="color" value={s.backgroundColor || '#FFFFFF'} onChange={(e) => set('backgroundColor', e.target.value)}
                                className="w-7 h-7 rounded-lg border-2 border-slate-200 cursor-pointer overflow-hidden p-0" title="Custom color" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Padding</Label>
                        {[
                            { label: 'Top', key: 'paddingTop' },
                            { label: 'Bottom', key: 'paddingBottom' },
                            { label: 'Left', key: 'paddingLeft' },
                            { label: 'Right', key: 'paddingRight' },
                        ].map(({ label, key }) => (
                            <div key={key} className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400 w-14 shrink-0">{label}</span>
                                <input type="range" min={0} max={100} value={s[key] ?? 16} onChange={(e) => set(key, Number(e.target.value))} className="flex-1 accent-[#00c3c0]" />
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={s[key] ?? 16}
                                    onChange={(e) => set(key, Number(e.target.value))}
                                    className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#00c3c0]/50"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Margin</Label>
                        {[
                            { label: 'Top', key: 'marginTop' },
                            { label: 'Bottom', key: 'marginBottom' },
                            { label: 'Left', key: 'marginLeft' },
                            { label: 'Right', key: 'marginRight' },
                        ].map(({ label, key }) => (
                            <div key={key} className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400 w-14 shrink-0">{label}</span>
                                <input type="range" min={0} max={100} value={s[key] ?? 0} onChange={(e) => set(key, Number(e.target.value))} className="flex-1 accent-[#00c3c0]" />
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={s[key] ?? 0}
                                    onChange={(e) => set(key, Number(e.target.value))}
                                    className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#00c3c0]/50"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Corner Radius</Label>
                        <div className="flex items-center gap-3">
                            <input type="range" min={0} max={48} value={s.borderRadius ?? 0} onChange={(e) => set('borderRadius', Number(e.target.value))} className="flex-1 accent-[#00c3c0]" />
                            <Input
                                type="number"
                                min={0}
                                max={48}
                                value={s.borderRadius ?? 0}
                                onChange={(e) => set('borderRadius', Number(e.target.value))}
                                className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#00c3c0]/50"
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Borders</Label>
                        {[
                            { label: 'Top', key: 'borderTopWidth' },
                            { label: 'Bottom', key: 'borderBottomWidth' },
                            { label: 'Left', key: 'borderLeftWidth' },
                            { label: 'Right', key: 'borderRightWidth' },
                        ].map(({ label, key }) => (
                            <div key={key} className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400 w-14 shrink-0">{label}</span>
                                <input type="range" min={0} max={20} value={s[key] ?? 0} onChange={(e) => set(key, Number(e.target.value))} className="flex-1 accent-[#00c3c0]" />
                                <Input
                                    type="number"
                                    min={0}
                                    max={20}
                                    value={s[key] ?? 0}
                                    onChange={(e) => set(key, Number(e.target.value))}
                                    className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#00c3c0]/50"
                                />
                            </div>
                        ))}
                        <div className="flex flex-col gap-2 mt-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Color & Style</span>
                            <div className="flex gap-2 items-center">
                                <input type="color" value={s.borderColor || '#e2e8f0'} onChange={(e) => set('borderColor', e.target.value)}
                                    className="w-7 h-7 rounded-lg border-2 border-slate-200 cursor-pointer overflow-hidden p-0" title="Border color" />
                                <select
                                    value={s.borderStyle || 'solid'}
                                    onChange={(e) => set('borderStyle', e.target.value)}
                                    className="h-8 text-xs font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00c3c0]/20 focus:border-[#00c3c0] outline-none px-2 flex-1 bg-white"
                                >
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}

// ─────────────────────────────────────────
//  Main Page Builder Component
// ─────────────────────────────────────────
const INITIAL = [
    newBlock(BLOCK_TYPES.HEADING),
    newBlock(BLOCK_TYPES.TEXT),
];

interface PageBuilderProps {
    initialContent?: string;
    onChange: (html: string) => void;
}

export default function PageBuilder({ initialContent, onChange }: PageBuilderProps) {
    const [blocks, setBlocks] = useState<any[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load initial content
    useEffect(() => {
        if (initialContent) {
            // Try to parse blocks from HTML comment
            const commentMatch = initialContent.match(/<!-- PAGE_BLOCKS:(.*?) -->/);
            if (commentMatch && commentMatch[1]) {
                try {
                    const parsed = JSON.parse(commentMatch[1]);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setBlocks(parsed);
                        setIsLoaded(true);
                        return;
                    }
                } catch (e) {
                    console.error('Failed to parse blocks from content:', e);
                }
            }
        }

        // Use default initial blocks
        setBlocks(INITIAL);
        setIsLoaded(true);
    }, [initialContent]);

    // Generate HTML and call onChange when blocks change
    useEffect(() => {
        if (isLoaded) {
            const html = generateHTML(blocks);
            onChange(html);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocks, isLoaded]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = ({ active, over }: any) => {
        if (over && active.id !== over.id) {
            setBlocks(prev => {
                const oi = prev.findIndex((b: any) => b.id === active.id);
                const ni = prev.findIndex((b: any) => b.id === over.id);
                return arrayMove(prev, oi, ni);
            });
        }
        setActiveId(null);
    };

    const addBlock = (type: string, extra: any = {}) => {
        const b = newBlock(type, extra);
        setBlocks(prev => [...prev, b]);
        setSelectedId(b.id);
    };

    const deleteBlock = (id: string) => {
        setBlocks(prev => prev.filter((b: any) => b.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const updateBlock = (id: string, updates: any) => {
        setBlocks(prev => prev.map((b: any) => b.id === id ? { ...b, ...updates } : b));
    };

    const addBlockToColumn = useCallback((parentId: string, colIndex: number, type: string) => {
        const child = newBlock(type);
        setBlocks(prev => prev.map((b: any) => {
            if (b.id !== parentId) return b;
            return {
                ...b,
                columns: b.columns.map((col: any, ci: number) => {
                    if (ci !== colIndex) return col;
                    return { ...col, blocks: [...col.blocks, child] };
                }),
            };
        }));
        setSelectedId(child.id);
    }, []);

    const deleteChildBlock = useCallback((parentId: string, colIndex: number, childId: string) => {
        setBlocks(prev => prev.map((b: any) => {
            if (b.id !== parentId) return b;
            return {
                ...b,
                columns: b.columns.map((col: any, ci: number) => {
                    if (ci !== colIndex) return col;
                    return { ...col, blocks: col.blocks.filter((cb: any) => cb.id !== childId) };
                }),
            };
        }));
        if (selectedId === childId) setSelectedId(null);
    }, [selectedId]);

    const updateBlockContent = useCallback((id: string, newValue: string, field = 'content') => {
        setBlocks(prev => prev.map((b: any) => {
            if (b.id === id) return { ...b, [field]: newValue };
            if (b.type === BLOCK_TYPES.COLUMNS) {
                return {
                    ...b,
                    columns: b.columns.map((col: any) => ({
                        ...col,
                        blocks: col.blocks.map((cb: any) => cb.id === id ? { ...cb, [field]: newValue } : cb)
                    }))
                };
            }
            return b;
        }));
    }, []);

    let selectedBlock = blocks.find((b: any) => b.id === selectedId);
    if (!selectedBlock) {
        for (const b of blocks) {
            if (b.type === BLOCK_TYPES.COLUMNS) {
                for (const col of b.columns) {
                    const child = col.blocks.find((cb: any) => cb.id === selectedId);
                    if (child) { selectedBlock = child; break; }
                }
            }
            if (selectedBlock) break;
        }
    }

    const canvasWidth = viewMode === 'mobile' ? 375 : viewMode === 'tablet' ? 600 : 800;

    const BLOCK_PALETTE = [
        { type: BLOCK_TYPES.HEADING, icon: Type, label: 'Heading' },
        { type: BLOCK_TYPES.TEXT, icon: Type, label: 'Text' },
        { type: BLOCK_TYPES.IMAGE, icon: ImageIcon, label: 'Image' },
        { type: BLOCK_TYPES.BUTTON, icon: MousePointer2, label: 'Button' },
        { type: BLOCK_TYPES.DIVIDER, icon: Minus, label: 'Divider' },
        { type: BLOCK_TYPES.SPACER, icon: Eye, label: 'Spacer' },
        { type: BLOCK_TYPES.LIST, icon: List, label: 'List' },
    ];

    const COLUMN_PALETTE = [
        { layoutKey: '1-1', icon: Columns2, label: '2 Cols' },
        { layoutKey: '1-1-1', icon: Columns, label: '3 Cols' },
        { layoutKey: '2-1', icon: LayoutTemplate, label: '2/3 + 1/3' },
        { layoutKey: '1-2', icon: LayoutTemplate, label: '1/3 + 2/3' },
        { layoutKey: '1-1-1-1', icon: Columns, label: '4 Cols' },
    ];

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-3">
                    <RotateCw className="h-10 w-10 animate-spin text-[#00c3c0]" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Page Builder...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col border rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="h-14 bg-white border-b flex items-center justify-between shrink-0 px-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Page Builder</span>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {[
                        { mode: 'desktop' as const, icon: Monitor },
                        { mode: 'tablet' as const, icon: Tablet },
                        { mode: 'mobile' as const, icon: Smartphone },
                    ].map(({ mode, icon: Icon }) => (
                        <button key={mode} onClick={() => setViewMode(mode)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${viewMode === mode ? 'bg-white shadow-sm text-[#00c3c0]' : 'text-slate-400 hover:text-slate-600'}`}>
                            <Icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden" style={{ minHeight: '600px' }}>
                {/* Left: Block palette */}
                <aside className="w-56 bg-white border-r shrink-0 flex flex-col">
                    <ScrollArea className="flex-1">
                        <div className="px-3 pt-4 pb-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Content Blocks</p>
                            <div className="grid grid-cols-2 gap-2">
                                {BLOCK_PALETTE.map(({ type, icon: Icon, label }) => (
                                    <button key={type} onClick={() => addBlock(type)}
                                        className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-[#00c3c0]/30 hover:shadow-lg transition-all group text-center">
                                        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:text-[#00c3c0] group-hover:border-[#00c3c0]/30 transition-colors shadow-sm">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-700">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="px-3 my-3">
                            <div className="h-px bg-slate-100" />
                        </div>

                        <div className="px-3 pb-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Column Layouts</p>
                            <div className="flex flex-col gap-2">
                                {COLUMN_PALETTE.map(({ layoutKey, icon: Icon, label }) => (
                                    <button
                                        key={layoutKey}
                                        onClick={() => addBlock(BLOCK_TYPES.COLUMNS, { layoutKey })}
                                        className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-[#6366F1]/30 hover:shadow-lg transition-all group"
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:text-[#6366F1] group-hover:border-[#6366F1]/30 transition-colors shadow-sm shrink-0">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-700">{label}</p>
                                            <p className="text-[8px] text-slate-400">{COLUMN_LAYOUTS[layoutKey].label}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </aside>

                {/* Center: Canvas */}
                <main className="flex-1 overflow-auto p-6 bg-slate-50" onClick={() => setSelectedId(null)}>
                    <div className="mx-auto transition-all duration-300" style={{ width: canvasWidth, maxWidth: '100%' }}>
                        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/80 overflow-hidden border border-slate-100">
                            <DndContext sensors={sensors} collisionDetection={closestCenter}
                                onDragStart={e => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
                                <SortableContext items={blocks.map((b: any) => b.id)} strategy={verticalListSortingStrategy}>
                                    <div className="px-10 py-8 min-h-[400px] space-y-3 relative" id="page-builder-canvas">
                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                                #page-builder-canvas .page-block-renderer p,
                                                #page-builder-canvas .page-block-renderer h1,
                                                #page-builder-canvas .page-block-renderer h2,
                                                #page-builder-canvas .page-block-renderer h3,
                                                #page-builder-canvas .page-block-renderer ul,
                                                #page-builder-canvas .page-block-renderer ol,
                                                #page-builder-canvas .page-block-renderer a,
                                                #page-builder-canvas .page-block-renderer img,
                                                #page-builder-canvas .page-block-renderer hr {
                                                    margin: 0;
                                                    padding: 0;
                                                    box-sizing: border-box;
                                                }
                                            `
                                        }} />
                                        {blocks.length === 0 ? (
                                            <div className="h-64 flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-2xl text-slate-300">
                                                <Plus className="w-10 h-10 mb-3 stroke-1 animate-pulse" />
                                                <p className="text-xs font-bold uppercase tracking-wider">Add blocks from the left panel</p>
                                            </div>
                                        ) : (
                                            blocks.map((block: any) => (
                                                <SortableBlock
                                                    key={block.id}
                                                    block={block}
                                                    isSelected={selectedId === block.id}
                                                    onSelect={setSelectedId}
                                                    onDelete={deleteBlock}
                                                    selectedId={selectedId}
                                                    onDeleteChild={deleteChildBlock}
                                                    onAddBlockToColumn={addBlockToColumn}
                                                    updateBlockContent={updateBlockContent}
                                                    viewMode={viewMode}
                                                />
                                            ))
                                        )}
                                    </div>
                                </SortableContext>

                                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.3' } } }) }}>
                                    {activeId ? (
                                        <div className="bg-white border-2 border-[#00c3c0] rounded-xl p-4 shadow-2xl opacity-80">
                                            <GripVertical className="w-5 h-5 text-[#00c3c0]" />
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </div>
                    </div>
                </main>

                {/* Right: Properties */}
                <aside className="w-80 bg-white border-l shrink-0 flex flex-col overflow-hidden">
                    <PropertyPanel
                        block={selectedBlock}
                        onUpdate={updateBlock}
                        blocks={blocks}
                        setBlocks={setBlocks}
                    />
                </aside>
            </div>
        </div>
    );
}

// Export utility functions for use in parent components
export { generateHTML, blockToHTML, newBlock };