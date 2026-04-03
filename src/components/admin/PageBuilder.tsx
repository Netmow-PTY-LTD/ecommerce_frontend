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
    ChevronDown,
    ChevronUp,
    HelpCircle,
    Zap,
    Video,
    Share2,
    PlusCircle,
    Link,
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
    ICON_BOX: 'icon_box',
    ACCORDION: 'accordion',
    VIDEO: 'video',
    SOCIAL: 'social',
    FAQ_SECTION: 'faq_section',
    FEATURE_SECTION: 'feature_section',
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
    backgroundImage: '',
};

// ─────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────
const IconComponent = ({ icon: iconName, className = "w-6 h-6" }: { icon: string, className?: string }) => {
    const Icon = (require('lucide-react')[iconName] as any) || (require('lucide-react')['HelpCircle'] as any);
    if (!Icon) return <div className={className} />;
    return <Icon className={className} />;
};

function newBlock(type: string, extra: Record<string, any> = {}) {
    const id = Math.random().toString(36).slice(2, 10);
    const base = {
        id,
        type,
        customId: '',
        customClass: '',
        parentClass: '',
        styles: { ...defaultBlockStyles }
    };
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
        case BLOCK_TYPES.ICON_BOX:
            return { ...base, icon: 'Layout', title: 'Feature Title', description: 'Description text...', url: '#', styles: { ...defaultBlockStyles, textAlign: 'center' } };
        case BLOCK_TYPES.ACCORDION:
            return { ...base, items: [{ title: 'Question 1', content: 'Answer text...' }], styles: { ...defaultBlockStyles } };
        case BLOCK_TYPES.VIDEO:
            return { ...base, url: '', styles: { ...defaultBlockStyles } };
        case BLOCK_TYPES.SOCIAL:
            return { ...base, items: [{ icon: 'Facebook', url: '#' }], styles: { ...defaultBlockStyles, textAlign: 'center' } };
        case BLOCK_TYPES.COLUMNS: {
            const layoutKey = extra.layoutKey || '1-1';
            const ratios = COLUMN_LAYOUTS[layoutKey as keyof typeof COLUMN_LAYOUTS]?.ratios || [1, 1];
            return {
                ...base,
                layoutKey,
                styles: { ...defaultBlockStyles, paddingLeft: 8, paddingRight: 8, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FFFFFF' },
                columns: ratios.map((ratio: any) => ({
                    id: Math.random().toString(36).slice(2, 10),
                    ratio,
                    blocks: [],
                })),
            };
        }
        case BLOCK_TYPES.FAQ_SECTION:
            return {
                ...base,
                heading: 'Your Questions',
                headingHighlight: 'Answered',
                highlightColor: '#ffb300',
                imageUrl: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&q=80&w=600',
                items: [
                    { question: 'What services do you offer?', answer: 'We offer a wide range of logistics and supply chain solutions.' },
                    { question: 'How can I track my order?', answer: 'You can track your order using the tracking number provided in your email.' }
                ],
                styles: { ...defaultBlockStyles, backgroundColor: '#f8fafc' }
            };
        case BLOCK_TYPES.FEATURE_SECTION:
            return {
                ...base,
                title: 'Global Express Logistics',
                subtitle: 'Our Services',
                description: 'We provide specialized logistics solutions tailored to your business needs.',
                gradientStart: '#0a1d56',
                gradientEnd: '#d2152a',
                items: [
                    { icon: 'Truck', title: 'Road Freight', subtitle: 'Fast Delivery' },
                    { icon: 'Ship', title: 'Ocean Freight', subtitle: 'Global Shipping' }
                ],
                styles: { ...defaultBlockStyles, paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 }
            };
        default:
            return base;
    }
}

// ─────────────────────────────────────────
//  Column Cell – drop zone for child blocks
// ─────────────────────────────────────────
interface ColumnCellProps {
    column: any;
    colIndex: number;
    parentBlockId: string;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDeleteChild: (parentId: string, colIndex: number, childId: string) => void;
    onAddBlockToColumn: (parentId: string, colIndex: number, type: string) => void;
    updateBlockContent: (id: string, content: any, field: string) => void;
    isMobile: boolean;
}

function ColumnCell({
    column, colIndex, parentBlockId, selectedId, onSelect,
    onDeleteChild, onAddBlockToColumn, updateBlockContent, isMobile
}: ColumnCellProps) {
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

            {column.blocks.map((childBlock: any) => (
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

function QuickAddMenu({ onAdd }: { onAdd: (type: string) => void }) {
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
interface SortableBlockProps {
    block: any;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    selectedId: string | null;
    onDeleteChild: (parentId: string, colIndex: number, childId: string) => void;
    onAddBlockToColumn: (parentId: string, colIndex: number, type: string) => void;
    updateBlockContent: (id: string, content: any, field: string) => void;
    viewMode?: string;
}

function SortableBlock({ block, isSelected, onSelect, onDelete, selectedId, onDeleteChild, onAddBlockToColumn, updateBlockContent, viewMode }: SortableBlockProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

    if (block.type === BLOCK_TYPES.COLUMNS) {
        return (
            <div ref={setNodeRef} style={style} onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
                className={`group relative rounded-xl transition-all border-2 ${isSelected ? 'border-[#00c3c0] ring-4 ring-[#00c3c0]/10' : 'border-transparent hover:border-slate-200'} ${block.parentClass || ''}`}>
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
                        {COLUMN_LAYOUTS[block.layoutKey as keyof typeof COLUMN_LAYOUTS]?.label || 'Columns'}
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
                    {block.columns.map((col: any, colIdx: number) => (
                        <ColumnCell
                            key={col.id}
                            column={col}
                            colIndex={colIdx}
                            parentBlockId={block.id}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onDeleteChild={onDeleteChild}
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
            className={`group relative rounded-lg transition-all border-2 ${isSelected ? 'border-[#00c3c0] ring-4 ring-[#00c3c0]/10' : 'border-transparent hover:border-slate-200'} ${block.parentClass || ''}`}>
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
function BlockRenderer({ block, onUpdateContent, viewMode }: { block: any, onUpdateContent: any, viewMode?: string }) {
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
        backgroundImage: s.backgroundImage ? `url(${s.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };
    const textStyle = {
        color: s.color,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight || 1.5,
        letterSpacing: `${s.letterSpacing || 0}px`,
        textTransform: s.textTransform || 'none',
        textAlign: s.textAlign as any,
        fontWeight: s.fontWeight || 'normal',
        fontStyle: s.fontStyle || 'normal',
        textDecoration: s.textDecoration || 'none',
    };
    const contentRef = useRef<HTMLDivElement>(null);

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
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={containerStyle}>
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
                                        document.execCommand(cmd, false);
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
                                    document.execCommand('removeFormat', false);
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
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={containerStyle}>
                    <img src={block.src} alt={block.alt} className="w-full object-cover" style={{ borderRadius: s.borderRadius }} />
                </div>
            );
        case BLOCK_TYPES.BUTTON:
            return (
                <div id={block.customId || `blk-${block.id}`} style={{
                    ...containerStyle,
                    display: 'flex',
                    justifyContent: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'flex-end' : 'flex-start',
                }} className={`${block.customClass || ''}`}>
                    <a
                        href={block.url}
                        target={block.target || '_self'}
                        onClick={(e) => e.preventDefault()}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                            const newText = (e.currentTarget as HTMLElement).innerText;
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
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={containerStyle}>
                    <hr style={{ borderColor: s.color || '#e2e8f0' }} />
                </div>
            );
        case BLOCK_TYPES.SPACER:
            return <div style={{ height: block.height || 40, backgroundColor: 'transparent' }} className="border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 text-xs font-mono page-block-renderer">spacer · {block.height || 40}px</div>;

        case BLOCK_TYPES.ICON_BOX:
            return (
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={containerStyle}>
                    <div className="flex flex-col items-center">
                        <IconComponent icon={block.icon || 'Layout'} className="w-10 h-10 mb-2" />
                        <h3 className="font-bold">{block.title}</h3>
                        <p className="text-sm opacity-80">{block.description}</p>
                    </div>
                </div>
            );

        case BLOCK_TYPES.ACCORDION:
            return (
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={containerStyle}>
                    {(block.items || []).map((item: any, i: number) => (
                        <div key={i} className="mb-2 border rounded-lg overflow-hidden">
                            <div className="p-3 bg-slate-50 font-bold flex justify-between items-center">
                                {item.title}
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    ))}
                </div>
            );

        case BLOCK_TYPES.VIDEO:
            return (
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={containerStyle}>
                    <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        Video Placeholder: {block.url || 'No URL'}
                    </div>
                </div>
            );

        case BLOCK_TYPES.SOCIAL:
            return (
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={containerStyle}>
                    <div className="flex gap-4 justify-center">
                        {(block.items || []).map((item: any, i: number) => (
                            <div key={i} className="p-2 bg-slate-100 rounded-full">
                                <IconComponent icon={item.icon || 'Link'} className="w-5 h-5" />
                            </div>
                        ))}
                    </div>
                </div>
            );

        case BLOCK_TYPES.FAQ_SECTION:
            return (
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={containerStyle}>
                    <div className="spacer">
                        <h2 className="title text-center">
                            {block.heading}{' '}
                            <span style={{ color: block.highlightColor || '#ffb300' }}>({block.headingHighlight || 'FAQs'})</span>
                        </h2>
                        <div className="flex gap-10 items-center flex-row text-left mt-8">
                            <div className="shrink-0 flex justify-center w-full md:w-auto">
                                <div className="w-64 h-64 rounded-full overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                                    <img src={block.imageUrl} alt="FAQ" className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                                </div>
                            </div>
                            <div className="flex-1 w-full space-y-3">
                                {(block.items || []).map((item: any, idx: number) => (
                                    <div key={idx} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
                                        <div className="p-4 flex justify-between items-center bg-white group-hover:bg-slate-50/50 transition-colors">
                                            <span className="font-semibold text-slate-700 text-[15px]">{item.question}</span>
                                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                        </div>
                                        <div className="px-[18px] pb-4 text-sm text-slate-500 leading-relaxed">
                                            {item.answer}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );

        case BLOCK_TYPES.FEATURE_SECTION:
            return (
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={containerStyle}>
                    <div className="flex flex-col md:flex-row min-h-[450px] overflow-hidden rounded-3xl shadow-2xl">
                        <div
                            className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center text-white relative"
                            style={{
                                background: `linear-gradient(135deg, ${block.gradientStart || '#0a1d56'} 0%, ${block.gradientEnd || '#d2152a'} 100%)`
                            }}
                        >
                            <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-[-15deg] translate-x-16 pointer-events-none" />
                            <div className="spacer">
                                <h3 className="subtitle">{block.subtitle}</h3>
                                <h2 className="title">{block.title}</h2>
                                <p className="paragraph">{block.description}</p>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 p-6 md:p-10 bg-white md:bg-transparent flex items-center justify-center -mt-8 md:mt-0 md:-ml-12 z-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                                {(block.items || []).map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="bg-white p-5 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-5 transform hover:scale-[1.03] transition-all hover:shadow-2xl group"
                                    >
                                        <div className="w-14 h-14 shrink-0 rounded-2xl bg-slate-50 text-slate-800 flex items-center justify-center p-3 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                                            <IconComponent icon={item.icon || 'Zap'} className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="font-black text-slate-800 text-sm mb-0.5">{item.title}</h4>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-[#00c3c0] transition-colors">{item.subtitle}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );

        default:
            return null;
    }
}

// ─────────────────────────────────────────
//  HTML Export utility
// ─────────────────────────────────────────
function blockToHTML(block: any): string {
    const s = block.styles || {};
    const marginCSS = `margin:${s.marginTop || 0}px ${s.marginRight || 0}px ${s.marginBottom || 0}px ${s.marginLeft || 0}px;`;
    const borderCSS = `border-top-width:${s.borderTopWidth || 0}px;border-bottom-width:${s.borderBottomWidth || 0}px;border-left-width:${s.borderLeftWidth || 0}px;border-right-width:${s.borderRightWidth || 0}px;border-color:${s.borderColor || '#e2e8f0'};border-style:${s.borderStyle || 'solid'};`;
    const backgroundCSS = `background-color:${s.backgroundColor || 'transparent'};${s.backgroundImage ? `background-image:url(${s.backgroundImage});background-size:cover;background-position:center;` : ''}`;
    const borderRadiusCSS = `border-radius:${s.borderRadius || 0}px;`;

    const wrap = (content: string) => `<div id="${block.customId || `blk-${block.id}`}" class="${block.customClass || ''}" style="padding:${s.paddingTop || 0}px ${s.paddingRight || 0}px ${s.paddingBottom || 0}px ${s.paddingLeft || 0}px;${backgroundCSS}${borderRadiusCSS}box-sizing:border-box;${marginCSS}${borderCSS}">${content}</div>`;

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
            return wrap(`<img src="${block.src}" alt="${block.alt}" style="width:100%;display:block;border-radius:${s.borderRadius || 0}px;" />`);
        case BLOCK_TYPES.BUTTON:
            return wrap(`<div style="text-align:${s.textAlign};"><a href="${block.url}" target="${block.target || '_self'}" style="background-color:${s.backgroundColor};color:${s.color};border-radius:${s.borderRadius}px;font-size:${s.fontSize}px;padding:${s.buttonPaddingY || 10}px ${s.buttonPaddingX || 28}px;display:inline-block;font-weight:700;text-decoration:none;white-space:nowrap;">${block.text}</a></div>`);
        case BLOCK_TYPES.DIVIDER:
            return wrap(`<hr style="border:none;border-top:1px solid ${s.color || '#e2e8f0'};" />`);
        case BLOCK_TYPES.SPACER:
            return `<div style="height:${block.height || 40}px;"></div>`;
        case BLOCK_TYPES.COLUMNS: {
            const totalRatio = block.columns.reduce((a: number, c: any) => a + c.ratio, 0);
            const colHTMLs = block.columns.map((col: any) => {
                const pct = Math.round((col.ratio / totalRatio) * 100);
                const childHTML = col.blocks.map(blockToHTML).join('');
                return `<td class="col-block" valign="top" style="width:${pct}%;padding:4px;">${childHTML}</td>`;
            }).join('');
            return wrap(`<table class="col-row" width="100%" cellpadding="0" cellspacing="0"><tr>${colHTMLs}</tr></table>`);
        }
        case BLOCK_TYPES.ICON_BOX:
            return wrap(`
                <div style="text-align: ${s.textAlign || 'center'};">
                    <div style="margin-bottom: 10px;">Icon: ${block.icon}</div>
                    <h3 style="margin: 0 0 5px; font-size: 18px;">${block.title}</h3>
                    <p style="margin: 0; font-size: 14px; opacity: 0.8;">${block.description}</p>
                </div>
            `);
        case BLOCK_TYPES.ACCORDION:
            const accItems = (block.items || []).map((item: any) => `
                <div style="margin-bottom: 10px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="padding: 10px; background: #f8fafc; font-weight: bold;">${item.title}</div>
                    <div style="padding: 10px; font-size: 14px;">${item.content}</div>
                </div>
            `).join('');
            return wrap(`<div>${accItems}</div>`);
        case BLOCK_TYPES.VIDEO:
            return wrap(`<div style="background: #000; color: #fff; padding: 40px; text-align: center; border-radius: 8px;">Video: ${block.url || 'No URL'}</div>`);
        case BLOCK_TYPES.SOCIAL:
            const socialItems = (block.items || []).map((item: any) => `
                <a href="${item.url}" style="display: inline-block; margin: 0 5px; text-decoration: none;">Icon: ${item.icon}</a>
            `).join('');
            return wrap(`<div style="text-align: ${s.textAlign || 'center'};">${socialItems}</div>`);
        case BLOCK_TYPES.FAQ_SECTION: {
            const itemsHTML = (block.items || []).map((item: any) => `
                <div class="faq-item" style="margin-bottom: 12px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff;">
                    <div class="faq-question" style="padding: 16px; font-weight: 600; color: #334155; cursor: pointer;">
                        ${item.question}
                    </div>
                    <div class="faq-answer" style="padding: 0 16px 16px; color: #64748b; font-size: 14px;">
                        ${item.answer}
                    </div>
                </div>
            `).join('');

            const content = `
                <div class="faq-section spacer" style="padding: 40px 0;">
                    <h2 class="title text-center" style="text-align: center; margin-bottom: 30px;">
                        ${block.heading} <span style="color: ${block.highlightColor || '#ffb300'}">(${block.headingHighlight || 'FAQs'})</span>
                    </h2>
                    <div class="faq-container" style="display: flex; gap: 40px; align-items: center;">
                        <div class="faq-image" style="flex: 0 0 auto;">
                            <img src="${block.imageUrl}" alt="FAQ" style="width: 250px; height: 250px; border-radius: 50%; object-fit: cover;" />
                        </div>
                        <div class="faq-items" style="flex: 1;">
                            ${itemsHTML}
                        </div>
                    </div>
                </div>
            `;
            return wrap(content);
        }
        case BLOCK_TYPES.FEATURE_SECTION: {
            const featuresHTML = (block.items || []).map((item: any) => `
                <div class="feature-card" style="background: #fff; padding: 20px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #f8fafc; margin-bottom: 16px;">
                    <div class="feature-icon" style="width: 40px; height: 40px; margin-bottom: 12px;">
                        Icon: ${item.icon}
                    </div>
                    <h4 style="margin: 0 0 4px; font-weight: 900; color: #1e293b;">${item.title}</h4>
                    <span style="font-size: 10px; text-transform: uppercase; color: #94a3b8;">${item.subtitle}</span>
                </div>
            `).join('');

            const content = `
                <div class="feature-section" style="display: flex; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);">
                    <div class="feature-info" style="width: 50%; padding: 60px; background: linear-gradient(135deg, ${block.gradientStart || '#0a1d56'} 0%, ${block.gradientEnd || '#d2152a'} 100%); color: #fff;">
                        <span style="font-size: 14px; text-transform: uppercase; opacity: 0.8;">${block.subtitle}</span>
                        <h2 style="font-size: 36px; font-weight: 700; margin: 8px 0 16px;">${block.title}</h2>
                        <p style="opacity: 0.9; line-height: 1.6;">${block.description}</p>
                    </div>
                    <div class="feature-grid" style="width: 50%; padding: 40px; background: #f8fafc; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        ${featuresHTML}
                    </div>
                </div>
            `;
            return wrap(content);
        }
        default:
            return '';
    }
}

function generateHTML(blocks: any[]) {
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
//  Helper for editing lists of items (FAQ, Features, etc.)
// ─────────────────────────────────────────
function ItemsListEditor({ items, onUpdate, fields }: { items: any[], onUpdate: (items: any[]) => void, fields: { key: string, label: string, type: string }[] }) {
    const addItem = () => {
        const newItem: Record<string, string> = {};
        fields.forEach(f => newItem[f.key] = '');
        onUpdate([...items, newItem]);
    };

    const removeItem = (index: number) => {
        onUpdate(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, key: string, value: string) => {
        onUpdate(items.map((item, i) => i === index ? { ...item, [key]: value } : item));
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newItems = [...items];
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= items.length) return;
        [newItems[index], newItems[nextIndex]] = [newItems[nextIndex], newItems[index]];
        onUpdate(newItems);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative group">
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveItem(idx, 'up')} className="p-1 hover:bg-white rounded border border-slate-200 text-slate-400 hover:text-slate-600"><ChevronUp className="w-3 h-3" /></button>
                            <button onClick={() => moveItem(idx, 'down')} className="p-1 hover:bg-white rounded border border-slate-200 text-slate-400 hover:text-slate-600"><ChevronDown className="w-3 h-3" /></button>
                            <button onClick={() => removeItem(idx)} className="p-1 hover:bg-red-50 rounded border border-red-100 text-red-400 hover:text-red-600 ml-1"><Trash2 className="w-3 h-3" /></button>
                        </div>
                        <div className="space-y-3">
                            {fields.map(f => (
                                <div key={f.key} className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{f.label}</Label>
                                    {f.type === 'textarea' ? (
                                        <textarea
                                            className="w-full h-20 p-3 text-xs bg-white border border-slate-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-[#00c3c0]/20"
                                            value={item[f.key] || ''}
                                            onChange={(e: any) => updateItem(idx, f.key, e.target.value)}
                                        />
                                    ) : (
                                        <Input
                                            className="h-9 text-xs rounded-xl bg-white border-slate-200"
                                            value={item[f.key] || ''}
                                            onChange={(e: any) => updateItem(idx, f.key, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <Button onClick={addItem} variant="outline" className="w-full border-dashed border-2 py-6 rounded-2xl text-slate-400 hover:text-[#00c3c0] hover:border-[#00c3c0]/50 hover:bg-[#00c3c0]/5 transition-all group">
                <PlusCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Add New Item</span>
            </Button>
        </div>
    );
}

// ─────────────────────────────────────────
//  Property Panel
// ─────────────────────────────────────────
interface PropertyPanelProps {
    block: any;
    onUpdate: (id: string, updates: any) => void;
    blocks: any[];
    setBlocks: React.Dispatch<React.SetStateAction<any[]>>;
}

function PropertyPanel({ block, onUpdate, blocks, setBlocks }: PropertyPanelProps) {
    const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');
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
    const set = (key: string, val: any) => {
        onUpdate(block.id, { styles: { ...(block.styles || {}), [key]: val } });
    };
    const setContent = (updates: Record<string, any>) => {
        onUpdate(block.id, updates);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            <div className="p-4 border-b flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-[#ff8602]/10 flex items-center justify-center">
                    <MousePointer2 className="w-4 h-4 text-[#ff8602]" />
                </div>
                <div>
                    <Badge className="bg-slate-100 text-slate-500 border-none uppercase text-[8px] tracking-tight px-1.5 py-0.5 mb-0.5">
                        {block.type}
                    </Badge>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 leading-none">Property Editor</p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-2 bg-slate-50 border-b gap-1">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'content' ? 'bg-white shadow-md text-[#ff8602]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}`}
                >
                    <LayoutTemplate className="w-3 h-3" />
                    Content
                </button>
                <button
                    onClick={() => setActiveTab('style')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'style' ? 'bg-white shadow-md text-[#ff8602]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}`}
                >
                    <Palette className="w-3 h-3" />
                    Style
                </button>
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div className="p-5 space-y-6 text-sm">
                    {activeTab === 'content' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-1 duration-300">
                            {block.type === BLOCK_TYPES.COLUMNS && (
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Column Layout</Label>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {Object.entries(COLUMN_LAYOUTS).map(([key, { label }]) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    const ratios = COLUMN_LAYOUTS[key as keyof typeof COLUMN_LAYOUTS].ratios;
                                                    onUpdate(block.id, {
                                                        layoutKey: key,
                                                        columns: ratios.map((ratio: any, i: any) => ({
                                                            id: block.columns[i]?.id || Math.random().toString(36).slice(2, 10),
                                                            ratio,
                                                            blocks: block.columns[i]?.blocks || [],
                                                        })),
                                                    });
                                                }}
                                                className={`text-left text-[10px] font-bold px-3 py-2.5 rounded-xl border transition-all ${block.layoutKey === key ? 'bg-[#6366F1]/10 border-[#6366F1]/30 text-[#6366F1]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(block.type === BLOCK_TYPES.TEXT || block.type === BLOCK_TYPES.HEADING || block.type === BLOCK_TYPES.LIST) && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">HTML Content</Label>
                                    <textarea
                                        className="w-full min-h-[150px] p-4 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#00c3c0]/20 focus:border-[#00c3c0] resize-none outline-none leading-relaxed"
                                        value={block.content}
                                        onChange={(e: any) => setContent({ content: e.target.value })}
                                    />
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.IMAGE && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Image Source</Label>
                                        <div className="flex gap-2">
                                            <Input className="h-10 text-xs rounded-xl" placeholder="https://..." value={block.src} onChange={(e: any) => setContent({ src: e.target.value })} />
                                            <label className="shrink-0 h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
                                                <RotateCw className={`w-4 h-4 text-slate-500 ${isUploading ? 'animate-spin' : ''}`} />
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alt Text</Label>
                                        <Input className="h-10 text-xs rounded-xl" value={block.alt} onChange={(e: any) => setContent({ alt: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.BUTTON && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Label Text</Label>
                                        <Input className="h-10 text-xs rounded-xl font-bold" value={block.text} onChange={(e: any) => setContent({ text: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Action URL</Label>
                                        <div className="relative">
                                            <Input className="h-10 text-xs rounded-xl pl-9" value={block.url} onChange={(e: any) => setContent({ url: e.target.value })} />
                                            <Link className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.SPACER && (
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vertical Space (px)</Label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min={0} max={200} value={block.height || 40} onChange={(e: any) => setContent({ height: Number(e.target.value) })} className="flex-1 accent-[#00c3c0]" />
                                        <Input type="number" className="h-9 w-16 text-xs rounded-xl text-right font-bold" value={block.height || 40} onChange={(e: any) => setContent({ height: Number(e.target.value) })} />
                                    </div>
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.ICON_BOX && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Icon Name</Label>
                                        <Input className="h-10 text-xs rounded-xl" placeholder="Lucide icon name" value={block.icon} onChange={(e: any) => setContent({ icon: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Title</Label>
                                        <Input className="h-10 text-xs rounded-xl font-bold" value={block.title} onChange={(e: any) => setContent({ title: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</Label>
                                        <textarea className="w-full h-24 p-4 text-xs bg-slate-50 border border-slate-200 rounded-2xl resize-none outline-none focus:ring-2 focus:ring-[#ff8602]/20" value={block.description} onChange={(e: any) => setContent({ description: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.ACCORDION && (
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Questions & Answers</Label>
                                    <ItemsListEditor
                                        items={block.items || []}
                                        onUpdate={(newItems) => setContent({ items: newItems })}
                                        fields={[
                                            { key: 'title', label: 'Item Title', type: 'text' },
                                            { key: 'content', label: 'Detailed Answer', type: 'textarea' }
                                        ]}
                                    />
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.SOCIAL && (
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Social Connections</Label>
                                    <ItemsListEditor
                                        items={block.items || []}
                                        onUpdate={(newItems) => setContent({ items: newItems })}
                                        fields={[
                                            { key: 'icon', label: 'Platform (Lucide Icon)', type: 'text' },
                                            { key: 'url', label: 'Profile Link', type: 'text' }
                                        ]}
                                    />
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.FAQ_SECTION && (
                                <div className="space-y-6">
                                    <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Headings</Label>
                                            <Input className="h-10 text-xs rounded-xl font-bold bg-white" placeholder="Main Heading" value={block.heading} onChange={(e: any) => setContent({ heading: e.target.value })} />
                                            <Input className="h-10 text-xs rounded-xl bg-white" placeholder="Highlighted Text" value={block.headingHighlight} onChange={(e: any) => setContent({ headingHighlight: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accent Color</Label>
                                            <Input type="color" className="h-10 p-1 rounded-xl cursor-pointer" value={block.highlightColor} onChange={(e: any) => setContent({ highlightColor: e.target.value })} />
                                        </div>
                                    </div>
                                    <ItemsListEditor
                                        items={block.items || []}
                                        onUpdate={(newItems) => setContent({ items: newItems })}
                                        fields={[
                                            { key: 'question', label: 'Question', type: 'text' },
                                            { key: 'answer', label: 'Answer', type: 'textarea' }
                                        ]}
                                    />
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.FEATURE_SECTION && (
                                <div className="space-y-6">
                                    <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Header Content</Label>
                                            <Input className="h-10 text-xs rounded-xl font-bold bg-white" placeholder="Main Title" value={block.title} onChange={(e: any) => setContent({ title: e.target.value })} />
                                            <Input className="h-10 text-xs rounded-xl bg-white" placeholder="Subtitle" value={block.subtitle} onChange={(e: any) => setContent({ subtitle: e.target.value })} />
                                        </div>
                                        <textarea className="w-full h-20 p-4 text-xs bg-white border border-slate-100 rounded-2xl resize-none outline-none shadow-sm" placeholder="Intro Description" value={block.description} onChange={(e: any) => setContent({ description: e.target.value })} />
                                    </div>
                                    <ItemsListEditor
                                        items={block.items || []}
                                        onUpdate={(newItems) => setContent({ items: newItems })}
                                        fields={[
                                            { key: 'icon', label: 'Icon', type: 'text' },
                                            { key: 'title', label: 'Label', type: 'text' },
                                            { key: 'subtitle', label: 'Subtext', type: 'text' }
                                        ]}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-1 duration-300">
                            {/* Layout Spacing */}
                            <div className="space-y-6">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#ff8602]">Container Spacing</p>
                                <div className="space-y-5">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Padding</Label>
                                            <Badge className="bg-slate-100 text-slate-400 border-none px-1.5 text-[8px]">Inward</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[{ l: 'Top', k: 'paddingTop' }, { l: 'Bottom', k: 'paddingBottom' }, { l: 'Left', k: 'paddingLeft' }, { l: 'Right', k: 'paddingRight' }].map(p => (
                                                <div key={p.k} className="space-y-1.5">
                                                    <span className="text-[9px] text-slate-400">{p.l}</span>
                                                    <Input type="number" value={s[p.k] ?? 16} onChange={(e: any) => set(p.k, Number(e.target.value))} className="h-8 text-xs font-bold font-mono rounded-lg" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 h-px w-full" />
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Margin</Label>
                                            <Badge className="bg-slate-100 text-slate-400 border-none px-1.5 text-[8px]">Outward</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[{ l: 'Top', k: 'marginTop' }, { l: 'Bottom', k: 'marginBottom' }, { l: 'Left', k: 'marginLeft' }, { l: 'Right', k: 'marginRight' }].map(p => (
                                                <div key={p.k} className="space-y-1.5">
                                                    <span className="text-[9px] text-slate-400">{p.l}</span>
                                                    <Input type="number" value={s[p.k] ?? 0} onChange={(e: any) => set(p.k, Number(e.target.value))} className="h-8 text-xs font-bold font-mono rounded-lg" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Typography */}
                            {block.type !== BLOCK_TYPES.DIVIDER && block.type !== BLOCK_TYPES.SPACER && block.type !== BLOCK_TYPES.IMAGE && block.type !== BLOCK_TYPES.COLUMNS && (
                                <div className="space-y-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#ff8602]">Typography</p>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-slate-400 w-20 shrink-0">Text Size</span>
                                            <input type="range" min={10} max={64} value={s.fontSize || 16} onChange={(e: any) => set('fontSize', Number(e.target.value))} className="flex-1 accent-[#ff8602]" />
                                            <Input type="number" value={s.fontSize || 16} onChange={(e: any) => set('fontSize', Number(e.target.value))} className="h-8 w-14 text-right text-xs font-mono font-bold" />
                                        </div>
                                        <div className="flex gap-1.5">
                                            {[
                                                { align: 'left', icon: AlignLeft },
                                                { align: 'center', icon: AlignCenter },
                                                { align: 'right', icon: AlignRight },
                                            ].map(({ align, icon: Icon }) => (
                                                <button key={align} onClick={() => set('textAlign', align)}
                                                    className={`flex-1 h-10 flex items-center justify-center rounded-xl border transition-all ${s.textAlign === align ? 'bg-[#ff8602]/10 border-[#ff8602]/30 text-[#ff8602]' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                                                    <Icon className="w-4 h-4" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Visual Decor */}
                            <div className="space-y-6">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#ff8602]">Visual Design</p>
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Background Color</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {PALETTE_COLORS.map(c => (
                                                <button key={c} onClick={() => set('backgroundColor', c)}
                                                    style={{ backgroundColor: c }}
                                                    className={`w-7 h-7 rounded-lg border-2 transition-all ${s.backgroundColor === c ? 'border-slate-800 scale-110 shadow-md' : 'border-white hover:scale-110 shadow-sm'}`} />
                                            ))}
                                            <input type="color" value={s.backgroundColor || '#FFFFFF'} onChange={(e: any) => set('backgroundColor', e.target.value)}
                                                className="w-7 h-7 rounded-lg border-2 border-slate-200 cursor-pointer overflow-hidden p-0" title="Custom color" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Corner Radius</Label>
                                        <div className="flex items-center gap-3">
                                            <input type="range" min={0} max={48} value={s.borderRadius ?? 0} onChange={(e: any) => set('borderRadius', Number(e.target.value))} className="flex-1 accent-[#ff8602]" />
                                            <Input type="number" value={s.borderRadius ?? 0} onChange={(e: any) => set('borderRadius', Number(e.target.value))} className="h-8 w-14 text-right text-xs font-mono font-bold" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Border Settings</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[{ l: 'Width (px)', k: 'borderTopWidth' }, { l: 'Style', k: 'borderStyle' }].map(p => (
                                                <div key={p.k} className="space-y-1.5">
                                                    <span className="text-[9px] text-slate-400">{p.l}</span>
                                                    {p.k === 'borderTopWidth' ? (
                                                        <Input type="number" value={s[p.k] || 0} onChange={(e: any) => {
                                                            const val = Number(e.target.value);
                                                            onUpdate(block.id, {
                                                                styles: {
                                                                    ...s,
                                                                    borderTopWidth: val, borderBottomWidth: val, borderLeftWidth: val, borderRightWidth: val
                                                                }
                                                            });
                                                        }} className="h-8 text-xs font-mono" />
                                                    ) : (
                                                        <select value={s.borderStyle || 'solid'} onChange={(e: any) => set('borderStyle', e.target.value)} className="w-full h-8 px-2 text-[10px] font-bold border border-slate-200 rounded-lg bg-white outline-none">
                                                            <option value="solid">Solid</option>
                                                            <option value="dashed">Dashed</option>
                                                            <option value="dotted">Dotted</option>
                                                        </select>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[9px] text-slate-400 w-12">Color</span>
                                            <Input type="color" value={s.borderColor || '#e2e8f0'} onChange={(e: any) => set('borderColor', e.target.value)} className="h-8 flex-1 p-1 cursor-pointer rounded-lg border-slate-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Section */}
                            <div className="space-y-6 pt-4 border-t border-slate-100">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#ff8602]">Advanced Settings</p>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">HTML ID</Label>
                                        <Input className="h-9 text-xs rounded-xl" placeholder="e.g. contact-section" value={block.customId} onChange={(e: any) => setContent({ customId: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CSS Classes</Label>
                                        <Input className="h-9 text-xs rounded-xl" placeholder="e.g. custom-card shadow-lg" value={block.customClass} onChange={(e: any) => setContent({ customClass: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parent Class</Label>
                                        <Input className="h-9 text-xs rounded-xl" placeholder="e.g. wrapper-dark" value={block.parentClass} onChange={(e: any) => setContent({ parentClass: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Background Image</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                className="h-10 text-xs rounded-xl flex-1"
                                                placeholder="https://..."
                                                value={s.backgroundImage || ''}
                                                onChange={(e: any) => set('backgroundImage', e.target.value)}
                                            />
                                            <label className="shrink-0 h-10 w-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                                                <RotateCw className={`w-4 h-4 text-slate-400 ${isUploading ? 'animate-spin' : ''}`} />
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        setIsUploading(true);
                                                        const formData = new FormData();
                                                        formData.append('image', file);
                                                        try {
                                                            const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                            const data = await res.json();
                                                            if (data?.url) set('backgroundImage', data.url);
                                                            else alert('Failed upload');
                                                        } catch (err) {
                                                            console.error(err);
                                                        } finally {
                                                            setIsUploading(false);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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

    const WIDGET_PALETTE = [
        { type: BLOCK_TYPES.ICON_BOX, icon: Zap, label: 'Icon Box' },
        { type: BLOCK_TYPES.ACCORDION, icon: HelpCircle, label: 'Accordion' },
        { type: BLOCK_TYPES.VIDEO, icon: Video, label: 'Video' },
        { type: BLOCK_TYPES.SOCIAL, icon: Share2, label: 'Social' },
        { type: BLOCK_TYPES.FAQ_SECTION, icon: HelpCircle, label: 'FAQ Sec' },
        { type: BLOCK_TYPES.FEATURE_SECTION, icon: Zap, label: 'Feature Sec' },
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

                        <div className="px-3 py-3">
                            <div className="h-px bg-slate-100" />
                        </div>

                        <div className="px-3 pb-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Advanced Widgets</p>
                            <div className="grid grid-cols-2 gap-2">
                                {WIDGET_PALETTE.map(({ type, icon: Icon, label }) => (
                                    <button key={type} onClick={() => addBlock(type)}
                                        className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-[#ff8602]/30 hover:shadow-lg transition-all group text-center text-slate-600">
                                        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:text-[#ff8602] group-hover:border-[#ff8602]/30 transition-colors shadow-sm">
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
                                            <p className="text-[8px] text-slate-400">{COLUMN_LAYOUTS[layoutKey as keyof typeof COLUMN_LAYOUTS].label}</p>
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
                                onDragStart={e => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
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