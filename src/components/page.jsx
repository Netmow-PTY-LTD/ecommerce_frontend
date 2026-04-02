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
    Settings2,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { useAddEmailTemplateMutation, useGetEmailTemplateConstantsQuery, useGetSingleEmailTemplateQuery, useUpdateEmailTemplateMutation, useGetAllEmailCategoriesQuery } from '@/store/features/admin/emailApiService';
import { showSuccessToast, showErrorToast } from '@/components/common/toasts';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Select as ShadSelect,
    SelectContent as ShadSelectContent,
    SelectItem as ShadSelectItem,
    SelectTrigger as ShadSelectTrigger,
    SelectValue as ShadSelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

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
};

// ─────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────
const IconComponent = ({ icon: iconName, className = "w-6 h-6" }) => {
    const Lucide = require('lucide-react');
    const Icon = Lucide[iconName] || Lucide['HelpCircle'];
    if (!Icon) return <div className={className} />;
    return <Icon className={className} />;
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
            return { ...base, src: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&q=80&w=1170', alt: 'Email image', styles: { ...defaultBlockStyles, paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 } };
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
function ColumnCell({ column, colIndex, parentBlockId, selectedId, onSelect, onDeleteChild, onUpdateChild, onAddBlockToColumn, updateBlockContent, isMobile }) {
    return (
        <div
            style={{ flex: isMobile ? '1 1 100%' : column.ratio }}
            className="min-h-[80px] border-2 border-dashed border-slate-200 rounded-xl p-2 flex flex-col gap-2 relative group/col"
        >
            {/* Column drop label */}
            {column.blocks.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-[9px] font-bold uppercase tracking-widest text-slate-300 select-none pointer-events-none">
                    Drop here
                </div>
            )}

            {/* Render child blocks */}
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

            {/* Add block to column */}
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
                {/* Drag handle */}
                <div {...attributes} {...listeners}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1.5 text-slate-300 hover:text-slate-500 transition-opacity">
                    <GripVertical className="w-4 h-4" />
                </div>
                {/* Delete row */}
                {isSelected && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
                        className="absolute -right-3 -top-3 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}

                {/* Column layout badge */}
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
            {/* Drag handle */}
            <div {...attributes} {...listeners}
                className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1.5 text-slate-300 hover:text-slate-500 transition-opacity">
                <GripVertical className="w-4 h-4" />
            </div>
            {/* Delete */}
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

    // Initial sync
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
                <div style={containerStyle} className="email-block-renderer">
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
                    <div className="relative group/text-content text-renderer-container">
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
                            className="prose prose-slate max-w-none outline-none focus:ring-2 focus:ring-[#00c3c0]/10 rounded px-1 transition-all"
                        />
                    </div>
                </div>
            );
        case BLOCK_TYPES.IMAGE:
            return (
                <div style={containerStyle} className="email-block-renderer">
                    <img src={block.src} alt={block.alt} className="w-full object-cover" style={{ borderRadius: s.borderRadius }} />
                </div>
            );
        case BLOCK_TYPES.BUTTON:
            return (
                <div style={containerStyle} className="email-block-renderer">
                    <div style={{
                        display: 'flex',
                        justifyContent: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    }}>
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
                </div>
            );
        case BLOCK_TYPES.DIVIDER:
            return (
                <div style={containerStyle} className="email-block-renderer">
                    <hr style={{ borderColor: s.color || '#e2e8f0' }} />
                </div>
            );
        case BLOCK_TYPES.SPACER:
            return <div style={{ height: block.height || 40, backgroundColor: 'transparent' }} className="border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 text-xs font-mono email-block-renderer">spacer · {block.height || 40}px</div>;

        case BLOCK_TYPES.ICON_BOX:
            return (
                <div style={containerStyle} className="page-block-renderer">
                    <div className="flex flex-col items-center text-center">
                        <IconComponent icon={block.icon || 'Layout'} className="w-10 h-10 mb-2" />
                        <h3 className="font-bold">{block.title}</h3>
                        <p className="text-sm opacity-80">{block.description}</p>
                    </div>
                </div>
            );

        case BLOCK_TYPES.ACCORDION:
            return (
                <div style={containerStyle} className="page-block-renderer">
                    {(block.items || []).map((item, i) => (
                        <div key={i} className="mb-2 border rounded-lg overflow-hidden">
                            <div className="p-3 bg-slate-50 font-bold flex justify-between items-center">
                                {item.title}
                                <Plus className="w-4 h-4" />
                            </div>
                        </div>
                    ))}
                </div>
            );

        case BLOCK_TYPES.VIDEO:
            return (
                <div style={containerStyle} className="page-block-renderer">
                    <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        Video Placeholder: {block.url || 'No URL'}
                    </div>
                </div>
            );

        case BLOCK_TYPES.SOCIAL:
            return (
                <div style={containerStyle} className="page-block-renderer">
                    <div className="flex gap-4 justify-center">
                        {(block.items || []).map((item, i) => (
                            <div key={i} className="p-2 bg-slate-100 rounded-full">
                                <IconComponent icon={item.icon || 'Link'} className="w-5 h-5" />
                            </div>
                        ))}
                    </div>
                </div>
            );

        case BLOCK_TYPES.FAQ_SECTION: {
            return (
                <div style={containerStyle} className="email-block-renderer">
                    <div className='spacer'>
                        <h2 className="title text-center">
                            {block.heading}{' '}
                            <span style={{ color: block.highlightColor || '#ffb300' }}>({block.headingHighlight || 'FAQs'})</span>
                        </h2>
                        <div className={`flex gap-10 items-center flex-row text-left mt-8`}>
                            <div className="shrink-0 flex justify-center w-full md:w-auto">
                                <div className="w-64 h-64 rounded-full overflow-hidden bg-violet-50 flex items-center justify-center border border-violet-100 shadow-inner">
                                    <img src={block.imageUrl} alt="FAQ" className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                                </div>
                            </div>
                            <div className="flex-1 w-full space-y-3">
                                {(block.items || []).map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="p-4 flex justify-between items-center bg-white group-hover:bg-slate-50/50 transition-colors">
                                            <span className="font-semibold text-slate-700 text-[15px]">{item.question}</span>
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
        }
        case BLOCK_TYPES.FEATURE_SECTION: {
            return (
                <div style={containerStyle} className="email-block-renderer">
                    <div className="flex flex-col md:flex-row min-h-[450px] overflow-hidden rounded-3xl shadow-2xl">
                        <div
                            className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center text-white relative"
                            style={{
                                background: `linear-gradient(135deg, ${block.gradientStart || '#0a1d56'} 0%, ${block.gradientEnd || '#d2152a'} 100%)`
                            }}
                        >
                            <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-[-15deg] translate-x-16 pointer-events-none" />
                            <div className='spacer'>
                                <h3 className="subtitle">{block.subtitle}</h3>
                                <h2 className="title">{block.title}</h2>
                                <p className="paragraph">{block.description}</p>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 p-6 md:p-10 bg-white md:bg-transparent flex items-center justify-center -mt-8 md:mt-0 md:-ml-12 z-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                                {(block.items || []).map((item, idx) => (
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
        }
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
    const backgroundCSS = `background-color:${s.backgroundColor || 'transparent'};`;
    const borderRadiusCSS = `border-radius:${s.borderRadius || 0}px;`;

    const wrap = (inner) => `
        <div class="block-wrapper" style="padding:${s.paddingTop || 0}px ${s.paddingRight || 0}px ${s.paddingBottom || 0}px ${s.paddingLeft || 0}px;${backgroundCSS}${borderRadiusCSS}box-sizing:border-box;${marginCSS}${borderCSS}">
            ${inner}
        </div>
    `;

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
            const totalRatio = block.columns.reduce((a, c) => a + (c.ratio || 1), 0);
            const colHTMLs = block.columns.map((col) => {
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
            const accItems = (block.items || []).map((item) => `
                <div style="margin-bottom: 10px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="padding: 10px; background: #f8fafc; font-weight: bold;">${item.title}</div>
                    <div style="padding: 10px; font-size: 14px;">${item.content}</div>
                </div>
            `).join('');
            return wrap(`<div>${accItems}</div>`);
        case BLOCK_TYPES.VIDEO:
            return wrap(`<div style="background: #000; color: #fff; padding: 40px; text-align: center; border-radius: 8px;">Video: ${block.url || 'No URL'}</div>`);
        case BLOCK_TYPES.SOCIAL:
            const socialItems = (block.items || []).map((item) => `
                <a href="${item.url}" style="display: inline-block; margin: 0 5px; text-decoration: none;">Icon: ${item.icon}</a>
            `).join('');
            return wrap(`<div style="text-align: ${s.textAlign || 'center'};">${socialItems}</div>`);
        case BLOCK_TYPES.FAQ_SECTION: {
            const itemsHTML = (block.items || []).map((item) => `
                <div class="faq-item" style="margin-bottom: 12px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff;">
                    <div class="faq-question" style="padding: 16px; font-weight: 600; color: #334155; cursor: pointer;">
                        ${item.question}
                    </div>
                    <div class="faq-answer" style="padding: 0 16px 16px; color: #64748b; font-size: 14px;">
                        ${item.answer}
                    </div>
                </div>
            `).join('');

            return `
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
        }
        case BLOCK_TYPES.FEATURE_SECTION: {
            const featuresHTML = (block.items || []).map((item) => `
                <div class="feature-card" style="background: #fff; padding: 20px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #f8fafc; margin-bottom: 16px;">
                    <div class="feature-icon" style="width: 40px; height: 40px; margin-bottom: 12px;">
                        Icon: ${item.icon}
                    </div>
                    <h4 style="margin: 0 0 4px; font-weight: 900; color: #1e293b;">${item.title}</h4>
                    <span style="font-size: 10px; text-transform: uppercase; color: #94a3b8;">${item.subtitle}</span>
                </div>
            `).join('');

            return `
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
        .spacer { padding: 40px 0; }
        .text-center { text-align: center; }
    </style>`;

    const designComment = `\n<!-- VISUAL_DESIGN_BLOCKS:${JSON.stringify(blocks).replace(/--/g, '\\u002d\\u002d')} -->`;

    return `${responsiveCSS}
<div style="background:#fff;font-family:Arial,sans-serif;margin:0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <div style="max-width:800px;margin:0 auto;background:#fff;">
                    ${blocksHtml}
                </div>
            </td>
        </tr>
    </table>
</div>${designComment}`;
}

// ─────────────────────────────────────────
//  Property Panel
// ─────────────────────────────────────────
function PropertyPanel({ block, onUpdate, blocks, setBlocks, templateKey, setTemplateKey, constantsData, isLoadingConstants }) {
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('template');

    // Auto-switch tab based on selection
    useEffect(() => {
        if (block) setActiveTab('element');
        else setActiveTab('template');
    }, [block?.id]);

    const templateKeyOptions = useMemo(() => {
        if (!constantsData) return [];
        const keys = Array.isArray(constantsData)
            ? constantsData
            : Array.isArray(constantsData?.data)
                ? constantsData.data
                : Array.isArray(constantsData?.templateKeys)
                    ? constantsData.templateKeys
                    : [];
        return keys.map((k) => {
            const val = typeof k === 'string' ? k : (k?.key ?? k?.value ?? k?.name ?? String(k));
            const label = typeof k === 'object' && k?.label ? k.label : val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            return { label, value: val };
        });
    }, [constantsData]);

    const selectedVariableInfo = useMemo(() => {
        if (!constantsData || !templateKey) return null;
        const keys = Array.isArray(constantsData)
            ? constantsData
            : Array.isArray(constantsData?.data)
                ? constantsData.data
                : Array.isArray(constantsData?.templateKeys)
                    ? constantsData.templateKeys
                    : [];
        return keys.find(k => (typeof k === 'string' ? k : (k?.key ?? k?.value ?? k?.name)) === templateKey);
    }, [constantsData, templateKey]);

    return (
        <div className="flex flex-col h-full min-h-0 bg-white">
            {/* Tab Switcher */}
            <div className="p-2 border-b bg-slate-50/50 flex gap-1">
                <button
                    onClick={() => setActiveTab('element')}
                    disabled={!block}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${!block ? 'opacity-30 cursor-not-allowed' : activeTab === 'element' ? 'bg-white shadow-sm text-[#ff8602] border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <MousePointer2 className="w-3 h-3" />
                    Element
                </button>
                <button
                    onClick={() => setActiveTab('template')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'template' ? 'bg-white shadow-sm text-[#00c3c0] border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Settings2 className="w-3 h-3" />
                    Template
                </button>
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div className="p-5">
                    {activeTab === 'element' && block && (() => {
                        // Logic for Element Settings
                        let isChildBlock = false;
                        let parentColBlock = null;
                        let parentColIndex = -1;
                        for (const b of blocks) {
                            if (b.type === BLOCK_TYPES.COLUMNS) {
                                for (let ci = 0; ci < b.columns.length; ci++) {
                                    if (b.columns[ci].blocks.find(cb => cb.id === block.id)) {
                                        isChildBlock = true;
                                        parentColBlock = b;
                                        parentColIndex = ci;
                                        break;
                                    }
                                }
                            }
                            if (isChildBlock) break;
                        }

                        const updateChildBlock = (key, val) => {
                            if (!isChildBlock) return;
                            setBlocks(prev => prev.map(b => {
                                if (b.id !== parentColBlock.id) return b;
                                return {
                                    ...b,
                                    columns: b.columns.map((col, ci) => {
                                        if (ci !== parentColIndex) return col;
                                        return {
                                            ...col,
                                            blocks: col.blocks.map(cb =>
                                                cb.id === block.id ? { ...cb, ...key } : cb
                                            ),
                                        };
                                    }),
                                };
                            }));
                        };

                        const s = block.styles || {};
                        const set = (key, val) => {
                            if (isChildBlock) {
                                updateChildBlock({ styles: { ...(block.styles || {}), [key]: val } });
                            } else {
                                onUpdate(block.id, { styles: { ...(block.styles || {}), [key]: val } });
                            }
                        };
                        const setContent = (updates) => {
                            if (isChildBlock) {
                                updateChildBlock(updates);
                            } else {
                                onUpdate(block.id, updates);
                            }
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
                                else showErrorToast('Failed to get uploaded image URL.');
                            } catch (err) {
                                console.error('Upload error:', err);
                                showErrorToast('Failed to upload image.');
                            } finally {
                                setIsUploading(false);
                            }
                        };

                        return (
                            <div className="space-y-6 text-sm">
                                <Badge className="bg-[#ff8602]/10 text-[#ff8602] border-[#ff8602]/20 uppercase text-[9px] tracking-widest px-3 py-1">
                                    {block.type}
                                </Badge>

                                {/* Column layout picker */}
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

                                {/* Content fields */}
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
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Image Source Options</Label>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="h-9 text-xs rounded-xl cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#00c3c0]/10 file:text-[#00c3c0] hover:file:bg-[#00c3c0]/20"
                                                disabled={isUploading}
                                            />
                                            {isUploading && <p className="text-[10px] text-[#00c3c0] font-bold animate-pulse">Uploading...</p>}
                                            <div className="flex items-center justify-center my-2">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">OR</span>
                                            </div>
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
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Link Target</Label>
                                            <ShadSelect value={block.target || '_self'} onValueChange={(val) => setContent({ target: val })}>
                                                <ShadSelectTrigger className="h-9 rounded-xl border-slate-200 text-xs">
                                                    <ShadSelectValue placeholder="Select target" />
                                                </ShadSelectTrigger>
                                                <ShadSelectContent>
                                                    <ShadSelectItem value="_self">Same Tab (Default)</ShadSelectItem>
                                                    <ShadSelectItem value="_blank">New Tab (_blank)</ShadSelectItem>
                                                </ShadSelectContent>
                                            </ShadSelect>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-[#00c3c0]">Button Padding</Label>
                                            {[
                                                { label: 'Horizontal', key: 'buttonPaddingX', min: 0, max: 100 },
                                                { label: 'Vertical', key: 'buttonPaddingY', min: 0, max: 100 },
                                            ].map(({ label, key, min, max }) => (
                                                <div key={key} className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-400 w-16 shrink-0">{label}</span>
                                                    <input type="range" min={min} max={max} value={s[key] ?? (key === 'buttonPaddingX' ? 28 : 10)} onChange={(e) => set(key, Number(e.target.value))} className="flex-1 accent-[#00c3c0]" />
                                                    <Input
                                                        type="number"
                                                        min={min}
                                                        max={max}
                                                        value={s[key] ?? (key === 'buttonPaddingX' ? 28 : 10)}
                                                        onChange={(e) => set(key, Number(e.target.value))}
                                                        className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#00c3c0]/50"
                                                    />
                                                </div>
                                            ))}
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

                                {/* Typography */}
                                {block.type !== BLOCK_TYPES.DIVIDER && block.type !== BLOCK_TYPES.SPACER && block.type !== BLOCK_TYPES.IMAGE && block.type !== BLOCK_TYPES.COLUMNS && block.type !== BLOCK_TYPES.HEADING && (
                                    <>
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
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-slate-400 w-20 shrink-0">Line Height</span>
                                                <input type="range" min={1} max={3} step={0.1} value={s.lineHeight || 1.5} onChange={(e) => set('lineHeight', Number(e.target.value))} className="flex-1 accent-[#00c3c0]" />
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={3}
                                                    step={0.1}
                                                    value={s.lineHeight || 1.5}
                                                    onChange={(e) => set('lineHeight', Number(e.target.value))}
                                                    className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#00c3c0]/50"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-slate-400 w-20 shrink-0">Letter Spacing</span>
                                                <input type="range" min={-2} max={10} step={0.5} value={s.letterSpacing || 0} onChange={(e) => set('letterSpacing', Number(e.target.value))} className="flex-1 accent-[#00c3c0]" />
                                                <Input
                                                    type="number"
                                                    min={-2}
                                                    max={10}
                                                    step={0.5}
                                                    value={s.letterSpacing || 0}
                                                    onChange={(e) => set('letterSpacing', Number(e.target.value))}
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
                                            <div className="flex gap-1.5">
                                                {[
                                                    { label: 'Bold', icon: Bold, key: 'fontWeight', activeVal: 'bold', normalVal: 'normal' },
                                                    { label: 'Italic', icon: Italic, key: 'fontStyle', activeVal: 'italic', normalVal: 'normal' },
                                                    { label: 'Underline', icon: Underline, key: 'textDecoration', activeVal: 'underline', normalVal: 'none' },
                                                    { label: 'Uppercase', icon: Type, key: 'textTransform', activeVal: 'uppercase', normalVal: 'none' },
                                                ].map(({ label, icon: Icon, key, activeVal, normalVal }) => (
                                                    <button
                                                        key={label}
                                                        onClick={() => set(key, s[key] === activeVal ? normalVal : activeVal)}
                                                        title={label}
                                                        className={`flex-1 h-9 flex items-center justify-center rounded-xl border transition-all ${s[key] === activeVal ? 'bg-[#ff8602]/10 border-[#ff8602]/30 text-[#ff8602]' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <Separator />
                                    </>
                                )}
                                {block.type === BLOCK_TYPES.HEADING && (
                                    <>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Type className="w-3.5 h-3.5 text-[#ff8602]" />
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-800">H2 Typography</Label>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-400 w-20 shrink-0">Font Size</span>
                                                    <input type="range" min={10} max={100} value={s.h2FontSize || 28} onChange={(e) => set('h2FontSize', Number(e.target.value))} className="flex-1 accent-[#ff8602]" />
                                                    <Input
                                                        type="number"
                                                        min={10}
                                                        max={100}
                                                        value={s.h2FontSize || 28}
                                                        onChange={(e) => set('h2FontSize', Number(e.target.value))}
                                                        className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#ff8602]/50"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-400 w-20 shrink-0">Line Height</span>
                                                    <input type="range" min={0.5} max={3} step={0.1} value={s.h2LineHeight || 1.2} onChange={(e) => set('h2LineHeight', Number(e.target.value))} className="flex-1 accent-[#ff8602]" />
                                                    <Input
                                                        type="number"
                                                        min={0.5}
                                                        max={3}
                                                        step={0.1}
                                                        value={s.h2LineHeight || 1.2}
                                                        onChange={(e) => set('h2LineHeight', Number(e.target.value))}
                                                        className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#ff8602]/50"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-400 w-20 shrink-0">Letter Spacing</span>
                                                    <input type="range" min={-2} max={20} step={0.5} value={s.h2LetterSpacing || 0} onChange={(e) => set('h2LetterSpacing', Number(e.target.value))} className="flex-1 accent-[#ff8602]" />
                                                    <Input
                                                        type="number"
                                                        min={-2}
                                                        max={20}
                                                        step={0.5}
                                                        value={s.h2LetterSpacing || 0}
                                                        onChange={(e) => set('h2LetterSpacing', Number(e.target.value))}
                                                        className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#ff8602]/50"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-400 w-20 shrink-0">Bottom Margin</span>
                                                    <input type="range" min={0} max={100} value={s.h2MarginBottom !== undefined ? s.h2MarginBottom : 16} onChange={(e) => set('h2MarginBottom', Number(e.target.value))} className="flex-1 accent-[#ff8602]" />
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={s.h2MarginBottom !== undefined ? s.h2MarginBottom : 16}
                                                        onChange={(e) => set('h2MarginBottom', Number(e.target.value))}
                                                        className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#ff8602]/50"
                                                    />
                                                </div>
                                                <div className="flex gap-1.5">
                                                    {[
                                                        { align: 'left', icon: AlignLeft },
                                                        { align: 'center', icon: AlignCenter },
                                                        { align: 'right', icon: AlignRight },
                                                    ].map(({ align, icon: Icon }) => (
                                                        <button key={align} onClick={() => set('h2TextAlign', align)}
                                                            className={`flex-1 h-9 flex items-center justify-center rounded-xl border transition-all ${s.h2TextAlign === align ? 'bg-[#ff8602]/10 border-[#ff8602]/30 text-[#ff8602]' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                                                            <Icon className="w-4 h-4" />
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-1.5">
                                                    {[
                                                        { label: 'Bold', icon: Bold, key: 'h2FontWeight', activeVal: 'bold', normalVal: 'normal' },
                                                        { label: 'Italic', icon: Italic, key: 'h2FontStyle', activeVal: 'italic', normalVal: 'normal' },
                                                        { label: 'Underline', icon: Underline, key: 'h2TextDecoration', activeVal: 'underline', normalVal: 'none' },
                                                        { label: 'Uppercase', icon: Type, key: 'h2TextTransform', activeVal: 'uppercase', normalVal: 'none' },
                                                    ].map(({ label, icon: Icon, key, activeVal, normalVal }) => (
                                                        <button
                                                            key={label}
                                                            onClick={() => set(key, s[key] === activeVal ? normalVal : activeVal)}
                                                            title={label}
                                                            className={`flex-1 h-9 flex items-center justify-center rounded-xl border transition-all ${s[key] === activeVal ? 'bg-[#ff8602]/10 border-[#ff8602]/30 text-[#ff8602]' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="space-y-3 pt-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">H2 Color</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {PALETTE_COLORS.map(c => (
                                                            <button key={c} onClick={() => set('h2Color', c)}
                                                                style={{ backgroundColor: c }}
                                                                className={`w-7 h-7 rounded-lg border-2 transition-all ${s.h2Color === c ? 'border-slate-800 scale-110 shadow-md' : 'border-white hover:scale-110 shadow-sm hover:shadow-md'}`} />
                                                        ))}
                                                        <input type="color" value={s.h2Color || '#1e293b'} onChange={(e) => set('h2Color', e.target.value)}
                                                            className="w-7 h-7 rounded-lg border-2 border-slate-200 cursor-pointer overflow-hidden p-0" title="Custom color" />
                                                    </div>
                                                </div>
                                            </div>
                                            <Separator />
                                        </div>
                                    </>
                                )}

                                {/* Colors */}
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

                                {block.type !== BLOCK_TYPES.DIVIDER && block.type !== BLOCK_TYPES.SPACER && block.type !== BLOCK_TYPES.IMAGE && block.type !== BLOCK_TYPES.COLUMNS && block.type !== BLOCK_TYPES.HEADING && (
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Text Color</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {PALETTE_COLORS.map(c => (
                                                <button key={c} onClick={() => set('color', c)}
                                                    style={{ backgroundColor: c }}
                                                    className={`w-7 h-7 rounded-lg border-2 transition-all ${s.color === c ? 'border-slate-800 scale-110 shadow-md' : 'border-white hover:scale-110 shadow-sm hover:shadow-md'}`} />
                                            ))}
                                            <input type="color" value={s.color || '#1e293b'} onChange={(e) => set('color', e.target.value)}
                                                className="w-7 h-7 rounded-lg border-2 border-slate-200 cursor-pointer overflow-hidden p-0" title="Custom color" />
                                        </div>
                                    </div>
                                )}

                                {block.type === BLOCK_TYPES.LIST && (
                                    <div className="space-y-4 mt-4 text-slate-400">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-[#00c3c0] flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#00c3c0]" />
                                                Bullet Color
                                            </Label>
                                            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                                {PALETTE_COLORS.map(c => (
                                                    <button key={c} onClick={() => set('bulletColor', c)}
                                                        style={{ backgroundColor: c }}
                                                        className={`w-7 h-7 rounded-lg border-2 transition-all ${s.bulletColor === c ? 'border-[#00c3c0] scale-110 shadow-md ring-4 ring-[#00c3c0]/10' : 'border-white hover:scale-110 shadow-sm hover:shadow-md'}`} />
                                                ))}
                                                <input type="color" value={s.bulletColor || '#00c3c0'} onChange={(e) => set('bulletColor', e.target.value)}
                                                    className="w-7 h-7 rounded-lg border-2 border-slate-200 cursor-pointer overflow-hidden p-0" title="Custom color" />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-[#00c3c0] flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#00c3c0]" />
                                                List Item Spacing
                                            </Label>
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                                <input type="range" min={0} max={100} value={s.listItemSpacing ?? 0} onChange={(e) => set('listItemSpacing', Number(e.target.value))} className="flex-1 accent-[#00c3c0]" />
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={s.listItemSpacing ?? 0}
                                                    onChange={(e) => set('listItemSpacing', Number(e.target.value))}
                                                    className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#00c3c0]/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Spacing */}
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
                                {/* Borders */}
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

                                <Separator />

                                {/* Paragraph Styling */}
                                {(block.type === BLOCK_TYPES.TEXT || block.type === BLOCK_TYPES.LIST) && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff8602]" />
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Paragraph Spacing</Label>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-slate-400 w-20 shrink-0">Bottom Margin</span>
                                                <input type="range" min={0} max={100} value={s.paragraphSpacing ?? 16} onChange={(e) => set('paragraphSpacing', Number(e.target.value))} className="flex-1 accent-[#ff8602]" />
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={s.paragraphSpacing ?? 16}
                                                    onChange={(e) => set('paragraphSpacing', Number(e.target.value))}
                                                    className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#ff8602]/50"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-slate-400 w-20 shrink-0">Padding</span>
                                                <input type="range" min={0} max={100} value={s.paragraphPadding ?? 0} onChange={(e) => set('paragraphPadding', Number(e.target.value))} className="flex-1 accent-[#ff8602]" />
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={s.paragraphPadding ?? 0}
                                                    onChange={(e) => set('paragraphPadding', Number(e.target.value))}
                                                    className="h-8 w-14 text-right text-xs font-mono font-bold border-slate-200 rounded-lg p-1.5 focus:ring-[#ff8602]/50"
                                                />
                                            </div>
                                        </div>
                                        <Separator />
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {activeTab === 'template' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-3.5 h-3.5 text-[#00c3c0]" />
                                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900">Template Settings</h3>
                            </div>

                            {/* Template Key Selector */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                    Template Type
                                    {isLoadingConstants && <Loader2 className="w-3 h-3 animate-spin text-[#00c3c0]" />}
                                </Label>
                                <SearchableSelect
                                    options={templateKeyOptions}
                                    value={templateKey}
                                    onChange={setTemplateKey}
                                    placeholder="Select type"
                                    isLoading={isLoadingConstants}
                                />
                                <p className="text-[9px] text-slate-400 italic mt-1.5">Determines dynamic tags available for selection.</p>
                            </div>

                            {/* Variables Reference */}
                            {selectedVariableInfo?.variables?.length > 0 ? (
                                <div className="bg-[#00c3c0]/5 border border-[#00c3c0]/10 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#00c3c0]">Variables</Label>
                                        <Badge variant="outline" className="h-4 bg-white border-[#00c3c0]/20 text-[#00c3c0] text-[8px] font-black uppercase px-1.5">
                                            {selectedVariableInfo.variables.length} Tags
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedVariableInfo.variables.map(v => (
                                            <Badge key={v} variant="outline" className="bg-white border-slate-200 text-slate-600 text-[9px] font-mono py-0.5 px-2 hover:border-[#00c3c0] hover:text-[#00c3c0] transition-all cursor-default select-all">
                                                {`{{${v}}}`}
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-slate-400 leading-relaxed mt-1">Copy these tags into dynamic content areas.</p>
                                </div>
                            ) : templateKey && !isLoadingConstants ? (
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                                    <p className="text-[10px] text-amber-600 font-medium">No variables defined for this type.</p>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                    <Settings2 className="w-6 h-6 text-slate-200 mb-2" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select a template type to see variables</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

// ─────────────────────────────────────────
//  Save-as-Template Modal
// ─────────────────────────────────────────

const TARGET_OPTIONS = [
    { label: 'Lawyer', value: 'lawyer' },
    { label: 'Client', value: 'client' },
    { label: 'Firm', value: 'firm' },
    { label: 'Admin', value: 'admin' },
    { label: 'Generic', value: 'generic' },
];

function SearchableSelect({ options, value, onChange, placeholder, isLoading }) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selectedLabel = options.find(o => o.value === value)?.label || '';

    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <div
                className={`flex h-10 w-full items-center rounded-xl border border-slate-200 bg-white px-3 text-sm cursor-pointer transition-all ${open ? 'ring-2 ring-[#00c3c0]/20 border-[#00c3c0]' : 'hover:border-slate-300'}`}
                onClick={() => { setOpen(v => !v); setSearch(''); }}
            >
                {open ? (
                    <input
                        autoFocus
                        className="flex-1 outline-none bg-transparent text-slate-700 placeholder:text-slate-400 text-sm"
                        placeholder="Search..."
                        value={search}
                        onChange={e => { e.stopPropagation(); setSearch(e.target.value); }}
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <span className={`flex-1 truncate ${value ? 'text-slate-700' : 'text-slate-400'}`}>
                        {isLoading ? 'Loading…' : (selectedLabel || placeholder)}
                    </span>
                )}
                <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-slate-400 text-center">No results found</div>
                        ) : (
                            filtered.map(opt => (
                                <div
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${opt.value === value ? 'bg-[#00c3c0]/10 text-[#00c3c0] font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {opt.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────
//  Helpers for Delay Conversion
// ─────────────────────────────────────────
const formatDelay = (ms) => {
    if (!ms || ms === 0) return '0m';
    const months = ms / (30 * 24 * 60 * 60 * 1000);
    if (months >= 1 && months % 1 === 0) return `${months}mo`;
    const weeks = ms / (7 * 24 * 60 * 60 * 1000);
    if (weeks >= 1 && weeks % 1 === 0) return `${weeks}w`;
    const days = ms / (24 * 60 * 60 * 1000);
    if (days >= 1 && days % 1 === 0) return `${days}d`;
    const hours = ms / (60 * 60 * 1000);
    if (hours >= 1 && hours % 1 === 0) return `${hours}h`;
    const minutes = Math.round(ms / (60 * 1000));
    return `${minutes}m`;
};

const parseDelay = (str) => {
    if (!str) return 0;
    const value = parseFloat(str);
    const unit = str.replace(/[0-9.]/g, '').toLowerCase().trim();

    if (unit === 'mo') return value * 30 * 24 * 60 * 60 * 1000;
    if (unit === 'w') return value * 7 * 24 * 60 * 60 * 1000;
    if (unit === 'd') return value * 24 * 60 * 60 * 1000;
    if (unit === 'h') return value * 60 * 60 * 1000;
    if (unit === 'm') return value * 60 * 1000;

    // Default to days if no unit is provided (preserving legacy behavior)
    return value * 24 * 60 * 60 * 1000;
};

function SaveModal({ open, onClose, onConfirm, isSaving, initialData, globalTemplateKey }) {
    const [form, setForm] = useState({
        title: '',
        templateKey: '',
        templateType: '',
        subject: '',
        categoryId: '',
        delay: '',
        step: 1
    });

    useEffect(() => {
        if (open) {
            setForm(p => ({
                ...p,
                templateKey: globalTemplateKey,
                title: initialData?.title || p.title || '',
                templateType: initialData?.templateType || initialData?.target || p.templateType || '',
                subject: initialData?.subject || p.subject || '',
                categoryId: initialData?.category?._id || initialData?.category || initialData?.categoryId?._id || (typeof initialData?.categoryId === 'string' ? initialData?.categoryId : '') || p.categoryId || '',
                delay: initialData?.delayTime !== undefined && initialData?.delayTime !== null
                    ? formatDelay(Number(initialData.delayTime))
                    : p.delay || '',
                step: initialData?.step || p.step || 1
            }));
        }
    }, [open, initialData, globalTemplateKey]);

    const { data: categoriesData, isLoading: isLoadingCategories } = useGetAllEmailCategoriesQuery({ page: 1, limit: 100 }, { skip: !open });

    const categoryOptions = useMemo(() => {
        if (!categoriesData?.data) return [];
        return categoriesData.data.map(c => ({ label: c.name, value: c._id }));
    }, [categoriesData]);

    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
    const isValid = form.title && form.templateKey && form.templateType && form.subject;

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6 animate-in zoom-in-95 duration-200">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Save as <span className="text-[#00c3c0]">Template</span></h2>
                    <p className="text-slate-500 text-sm mt-1 italic">Your design will be exported as HTML and saved.</p>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Template Title</Label>
                        <Input className="h-10 rounded-xl" placeholder="Welcome New Lawyer" value={form.title} onChange={(e) => set('title', e.target.value)} />
                    </div>

                    {/* Template Key (Read-only reference) */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Template Type</Label>
                            <p className="text-sm font-bold text-slate-700 capitalize">
                                {form.templateKey?.replace(/_/g, ' ') || <span className="text-red-400 italic">Not Selected</span>}
                            </p>
                        </div>
                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                            Fixed in Editor
                        </Badge>
                    </div>

                    {/* Target – shadcn Select */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Audience</Label>
                        <ShadSelect value={form.templateType} onValueChange={(val) => set('templateType', val)}>
                            <ShadSelectTrigger className="h-10 rounded-xl border-slate-200 text-sm">
                                <ShadSelectValue placeholder="Select target audience" />
                            </ShadSelectTrigger>
                            <ShadSelectContent>
                                {TARGET_OPTIONS.map(({ label, value }) => (
                                    <ShadSelectItem key={value} value={value}>{label}</ShadSelectItem>
                                ))}
                            </ShadSelectContent>
                        </ShadSelect>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Subject</Label>
                        <Input className="h-10 rounded-xl" placeholder="Welcome to Our Platform" value={form.subject} onChange={(e) => set('subject', e.target.value)} />
                    </div>

                    {/* Email Category – searchable */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Category</Label>
                        <SearchableSelect
                            options={categoryOptions}
                            value={form.categoryId}
                            onChange={(val) => set('categoryId', val)}
                            placeholder="Select a category"
                            isLoading={isLoadingCategories}
                        />
                    </div>

                    {/* Step & Delay Row */}
                    <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step Number</Label>
                            <Input
                                type="number"
                                min="1"
                                className="h-10 rounded-xl border-slate-200 text-sm"
                                placeholder="1"
                                value={form.step}
                                onChange={(e) => set('step', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delay (e.g. 1mo, 1d, 1h, 30m)</Label>
                            <Input
                                type="text"
                                className="h-10 rounded-xl border-slate-200 text-sm"
                                placeholder="0m"
                                value={form.delay}
                                onChange={(e) => set('delay', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                    <Button
                        disabled={isSaving || !isValid}
                        onClick={() => onConfirm(form)}
                        className="flex-1 bg-[#00c3c0] hover:bg-[#00c3c0]/90 rounded-xl text-white font-bold gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : 'Save Template'}
                    </Button>
                </div>
            </div>
        </div>
    );
}


// ─────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────
const INITIAL = [
    newBlock(BLOCK_TYPES.HEADING),
    newBlock(BLOCK_TYPES.TEXT),
    newBlock(BLOCK_TYPES.BUTTON),
];

export default function EmailBuilderPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [blocks, setBlocks] = useState([]);
    const [templateKey, setTemplateKey] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [viewMode, setViewMode] = useState('desktop');
    const [showSaveModal, setShowSaveModal] = useState(false);

    const { data: templateRes, isFetching: isFetchingTemplate } = useGetSingleEmailTemplateQuery(id, { skip: !id });
    const { data: constantsData, isLoading: isLoadingConstants } = useGetEmailTemplateConstantsQuery();
    const [addTemplate, { isLoading: isCreating }] = useAddEmailTemplateMutation();
    const [updateTemplate, { isLoading: isUpdating }] = useUpdateEmailTemplateMutation();

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Mode: Create New
        if (!id) {
            setBlocks(INITIAL);
            setIsLoaded(true);
            return;
        }

        // Mode: Edit Existing
        if (templateRes) {
            const template = templateRes.data || (templateRes.title ? templateRes : null);
            if (!template) return;

            console.log('Final Loader Data:', template);
            if (template.templateKey) setTemplateKey(template.templateKey);
            let loadedBlocks = null;

            // Recover from HTML comment in body field (Primary Persistence)
            if (template.body) {
                const commentMatch = template.body.match(/<!-- VISUAL_DESIGN_BLOCKS:(.*?) -->/);
                if (commentMatch && commentMatch[1]) {
                    try {
                        const parsed = JSON.parse(commentMatch[1]);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            console.log('Design recovered from body comment.');
                            loadedBlocks = parsed;
                        }
                    } catch (e) {
                        console.error('Failed to parse design from comment:', e);
                    }
                }
            }

            if (loadedBlocks) {
                setBlocks(loadedBlocks);
            } else if (template.body) {
                // Legacy fallback: show notice if HTML is present but design comment is missing
                setBlocks([{
                    id: `legacy-${Date.now()}`,
                    type: BLOCK_TYPES.TEXT,
                    content: 'This template contains legacy HTML content. Please recreate your design using the blocks on the left to enable visual editing.',
                    style: { padding: '24px', backgroundColor: '#fff7ed', color: '#9a3412', borderRadius: '12px', border: '1px dashed #fbbf24' }
                }]);
            } else {
                setBlocks(INITIAL);
            }

            setIsLoaded(true);
        }
    }, [id, templateRes]);

    const isSaving = isCreating || isUpdating;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = ({ active, over }) => {
        if (over && active.id !== over.id) {
            setBlocks(prev => {
                const oi = prev.findIndex(b => b.id === active.id);
                const ni = prev.findIndex(b => b.id === over.id);
                return arrayMove(prev, oi, ni);
            });
        }
        setActiveId(null);
    };

    const addBlock = (type, extra) => {
        const b = newBlock(type, extra);
        setBlocks(prev => [...prev, b]);
        setSelectedId(b.id);
    };

    const deleteBlock = (id) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const updateBlock = (id, updates) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    // Add a block inside a specific column
    const addBlockToColumn = useCallback((parentId, colIndex, type) => {
        const child = newBlock(type);
        setBlocks(prev => prev.map(b => {
            if (b.id !== parentId) return b;
            return {
                ...b,
                columns: b.columns.map((col, ci) => {
                    if (ci !== colIndex) return col;
                    return { ...col, blocks: [...col.blocks, child] };
                }),
            };
        }));
        setSelectedId(child.id);
    }, []);

    // Delete a child block from a column
    const deleteChildBlock = useCallback((parentId, colIndex, childId) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== parentId) return b;
            return {
                ...b,
                columns: b.columns.map((col, ci) => {
                    if (ci !== colIndex) return col;
                    return { ...col, blocks: col.blocks.filter(cb => cb.id !== childId) };
                }),
            };
        }));
        if (selectedId === childId) setSelectedId(null);
    }, [selectedId]);

    const updateBlockContent = useCallback((id, newValue, field = 'content') => {
        setBlocks(prev => prev.map(b => {
            if (b.id === id) return { ...b, [field]: newValue };
            if (b.type === BLOCK_TYPES.COLUMNS) {
                return {
                    ...b,
                    columns: b.columns.map(col => ({
                        ...col,
                        blocks: col.blocks.map(cb => cb.id === id ? { ...cb, [field]: newValue } : cb)
                    }))
                };
            }
            return b;
        }));
    }, []);

    const handleSave = async (meta) => {
        const html = generateHTML(blocks);
        // Extract {{variables}} from the subject line
        const subjectVars = (meta.subject.match(/\{\{(\w+)\}\}/g) || []).map(v => v.replace(/\{\{|\}\}/g, ''));

        const payload = {
            title: meta.title,
            templateKey: meta.templateKey,
            templateType: meta.templateType,
            target: meta.templateType, // Ensuring compatibility
            subject: meta.subject,
            categoryId: meta.categoryId || undefined,
            delayTime: parseDelay(meta.delay),
            step: Number(meta.step) || 1,
            body: html,
            variables: subjectVars,
        };

        try {
            if (id) {
                await updateTemplate({ id, data: payload }).unwrap();
                showSuccessToast('Template updated successfully!');
            } else {
                await addTemplate(payload).unwrap();
                showSuccessToast('Template created successfully!');
            }
            setShowSaveModal(false);
            router.push('/admin/email/template/list');
        } catch (err) {
            showErrorToast(err?.data?.message || 'Failed to save template.');
        }
    };

    // Resolve selected block – could be top-level or inside a column
    let selectedBlock = blocks.find(b => b.id === selectedId);
    if (!selectedBlock) {
        for (const b of blocks) {
            if (b.type === BLOCK_TYPES.COLUMNS) {
                for (const col of b.columns) {
                    const child = col.blocks.find(cb => cb.id === selectedId);
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

    if (!isLoaded || isFetchingTemplate) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50/30">
                <div className="flex flex-col items-center gap-3">
                    <RotateCw className="h-10 w-10 animate-spin text-[#00c3c0]" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Initializing Canvas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-0px)] bg-[#f8fafc] overflow-hidden">

            {/* ── Top bar ── */}
            <header className="h-14 bg-white border-b flex items-center justify-between shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" asChild>
                        <Link href="/admin/email/template/list"><ChevronLeft className="w-4 h-4 text-slate-500" /></Link>
                    </Button>
                    <div className="h-7 w-px bg-slate-100" />
                    <div>
                        <h1 className="text-sm font-black text-slate-900 leading-tight">Visual Email <span className="text-[#00c3c0]">Builder</span></h1>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Drag · Drop · Design</p>
                    </div>
                </div>

                {/* View toggles */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {[
                        { mode: 'desktop', icon: Monitor },
                        { mode: 'tablet', icon: Tablet },
                        { mode: 'mobile', icon: Smartphone },
                    ].map(({ mode, icon: Icon }) => (
                        <button key={mode} onClick={() => setViewMode(mode)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${viewMode === mode ? 'bg-white shadow-sm text-[#00c3c0]' : 'text-slate-400 hover:text-slate-600'}`}>
                            <Icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-9 rounded-xl text-[10px] uppercase font-bold tracking-widest px-4 border-slate-200"
                        onClick={() => {
                            const html = generateHTML(blocks);
                            const blob = new Blob([html], { type: 'text/html' });
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = 'email-template.html';
                            a.click();
                        }}>
                        Export HTML
                    </Button>
                    <Button onClick={() => setShowSaveModal(true)}
                        className="h-9 bg-[#00c3c0] hover:bg-[#00c3c0]/90 text-white rounded-xl text-[10px] uppercase font-bold tracking-widest px-5 shadow-lg shadow-[#00c3c0]/20 gap-2">
                        <Save className="w-3.5 h-3.5" /> Save Template
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">

                {/* ── Left: Block palette ── */}
                <aside className="w-56 bg-white border-r shrink-0 flex flex-col">
                    <ScrollArea className="flex-1">
                        {/* Content Blocks */}
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

                        {/* Column Layouts */}
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

                {/* ── Center: Canvas ── */}
                <main className="flex-1 overflow-auto p-10" onClick={() => setSelectedId(null)}>
                    <div className="mx-auto transition-all duration-300" style={{ width: canvasWidth, maxWidth: '100%' }}>
                        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/80 overflow-hidden border border-slate-100">
                            <div className="h-10 bg-slate-50 border-b flex items-center px-4 gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                                <span className="ml-2 text-[9px] font-mono text-slate-400 uppercase tracking-widest">email canvas · {canvasWidth}px</span>
                            </div>

                            <DndContext sensors={sensors} collisionDetection={closestCenter}
                                onDragStart={e => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
                                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                    <div className="px-10 py-8 min-h-[600px] space-y-3 relative" id="email-builder-canvas">
                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                                #email-builder-canvas .email-block-renderer p,
                                                #email-builder-canvas .email-block-renderer h1,
                                                #email-builder-canvas .email-block-renderer h2,
                                                #email-builder-canvas .email-block-renderer h3,
                                                #email-builder-canvas .email-block-renderer h4,
                                                #email-builder-canvas .email-block-renderer h5,
                                                #email-builder-canvas .email-block-renderer h6,
                                                #email-builder-canvas .email-block-renderer ul,
                                                #email-builder-canvas .email-block-renderer ol,
                                                #email-builder-canvas .email-block-renderer li,
                                                #email-builder-canvas .email-block-renderer a,
                                                #email-builder-canvas .email-block-renderer img,
                                                #email-builder-canvas .email-block-renderer hr,
                                                #email-builder-canvas .email-block-renderer table,
                                                #email-builder-canvas .email-block-renderer td { 
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
                                            blocks.map(block => (
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

                {/* ── Right: Properties ── */}
                <aside className="w-80 bg-white border-l shrink-0 flex flex-col overflow-hidden">
                    <div className="p-4 border-b flex items-center gap-2 shrink-0">
                        <Settings2 className="w-4 h-4 text-[#ff8602]" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Properties</p>
                    </div>
                    <PropertyPanel
                        block={selectedBlock}
                        onUpdate={updateBlock}
                        blocks={blocks}
                        setBlocks={setBlocks}
                        templateKey={templateKey}
                        setTemplateKey={setTemplateKey}
                        constantsData={constantsData}
                        isLoadingConstants={isLoadingConstants}
                    />
                </aside>
            </div>

            {/* ── Save modal ── */}
            <SaveModal
                open={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onConfirm={handleSave}
                isSaving={isSaving}
                initialData={templateRes?.data || (templateRes?.title ? templateRes : null)}
                globalTemplateKey={templateKey}
            />
        </div>
    );
}
