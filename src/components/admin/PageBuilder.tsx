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
import { cn } from '@/lib/utils';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';

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
    LOOP_GRID: 'loop_grid',
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
    backgroundImages: [],
    backgroundPositions: [],
    backgroundSizes: [],
    backgroundRepeats: [],
};

// ─────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────
const IconComponent = ({ icon: iconName, className = "w-6 h-6" }: { icon: string, className?: string }) => {
    const Icon = (require('lucide-react')[iconName] as any) || (require('lucide-react')['HelpCircle'] as any);
    if (!Icon) return <div className={className} />;
    return <Icon className={className} />;
};

// Correct SVG paths for Lucide icons
// Format: array of SVG element objects with type and attributes
const LUCIDE_ICON_SVGS: { [key: string]: Array<{ type: string, attrs?: Record<string, string>, content?: string }> } = {
    'Truck': [
        { type: 'path', attrs: { d: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2' } },
        { type: 'path', attrs: { d: 'M15 18H9' } },
        { type: 'path', attrs: { d: 'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14' } },
        { type: 'circle', attrs: { cx: '17', cy: '18', r: '2' } },
        { type: 'circle', attrs: { cx: '7', cy: '18', r: '2' } }
    ],
    'Ship': [
        { type: 'path', attrs: { d: 'M12 10.189V14' } },
        { type: 'path', attrs: { d: 'M12 2v3' } },
        { type: 'path', attrs: { d: 'M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6' } },
        { type: 'path', attrs: { d: 'M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76' } },
        { type: 'path', attrs: { d: 'M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1' } }
    ],
    'Zap': [
        { type: 'path', attrs: { d: 'M13 2L3 14h9l-1 6h6l1-6h9L13 2z' } }
    ],
    'Package': [
        { type: 'path', attrs: { d: 'm16.5 9.4-7.5 7.5-3.5-3.5 7.5-7.5' } },
        { type: 'path', attrs: { d: 'm16.5 9.4-2.226-2.226' } },
        { type: 'path', attrs: { d: 'm16.5 9.4 2.226 2.226' } },
        { type: 'circle', attrs: { cx: '9', cy: '9', r: '2.5' } },
        { type: 'circle', attrs: { cx: '17.5', cy: '9', r: '2.5' } }
    ],
    'Home': [
        { type: 'path', attrs: { d: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' } },
        { type: 'polyline', attrs: { points: '9 22 9 12 15 12 15 22' } }
    ],
    'User': [
        { type: 'path', attrs: { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' } },
        { type: 'circle', attrs: { cx: '12', cy: '7', r: '4' } }
    ],
    'ShoppingCart': [
        { type: 'circle', attrs: { cx: '8', cy: '21', r: '1' } },
        { type: 'path', attrs: { d: 'm1 1 4 4-4 4' } },
        { type: 'path', attrs: { d: 'M1 6h14l-1.68 8.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L13 6H5' } }
    ],
    'Settings': [
        { type: 'path', attrs: { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' } },
        { type: 'circle', attrs: { cx: '12', cy: '12', r: '3' } }
    ],
    'Heart': [
        { type: 'path', attrs: { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' } }
    ],
    'Star': [
        { type: 'polygon', attrs: { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' } }
    ],
    'CheckCircle': [
        { type: 'path', attrs: { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' } },
        { type: 'polyline', attrs: { points: '22 4 12 14.01 9 11.01' } }
    ],
    'XCircle': [
        { type: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
        { type: 'path', attrs: { d: 'm15 9-6 6' } },
        { type: 'path', attrs: { d: 'm9 9 6 6' } }
    ],
    'AlertCircle': [
        { type: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
        { type: 'line', attrs: { x1: '12', y1: '8', x2: '12', y2: '12' } },
        { type: 'line', attrs: { x1: '12', y1: '16', x2: '12.01', y2: '16' } }
    ],
    'Info': [
        { type: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
        { type: 'path', attrs: { d: 'M12 16v-4' } },
        { type: 'path', attrs: { d: 'M12 8h.01' } }
    ],
    'Mail': [
        { type: 'rect', attrs: { width: '20', height: '16', x: '2', y: '4', rx: '2' } },
        { type: 'path', attrs: { d: 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' } }
    ],
    'Phone': [
        { type: 'path', attrs: { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' } }
    ],
    'MapPin': [
        { type: 'path', attrs: { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' } },
        { type: 'circle', attrs: { cx: '12', cy: '10', r: '3' } }
    ],
    'Clock': [
        { type: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
        { type: 'polyline', attrs: { points: '12 6 12 12 16 14' } }
    ],
    'Calendar': [
        { type: 'rect', attrs: { width: '18', height: '18', x: '3', y: '4', rx: '2', ry: '2' } },
        { type: 'line', attrs: { x1: '16', y1: '2', x2: '16', y2: '6' } },
        { type: 'line', attrs: { x1: '8', y1: '2', x2: '8', y2: '6' } },
        { type: 'line', attrs: { x1: '3', y1: '10', x2: '21', y2: '10' } }
    ],
    'Search': [
        { type: 'circle', attrs: { cx: '11', cy: '11', r: '8' } },
        { type: 'path', attrs: { d: 'm21 21-4.3-4.3' } }
    ],
    'Filter': [
        { type: 'polygon', attrs: { points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' } }
    ],
    'Download': [
        { type: 'path', attrs: { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' } },
        { type: 'polyline', attrs: { points: '7 10 12 15 17 10' } },
        { type: 'line', attrs: { x1: '12', y1: '15', x2: '12', y2: '3' } }
    ],
    'Upload': [
        { type: 'path', attrs: { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' } },
        { type: 'polyline', attrs: { points: '17 8 12 3 7 8' } },
        { type: 'line', attrs: { x1: '12', y1: '3', x2: '12', y2: '15' } }
    ],
    'RefreshCw': [
        { type: 'path', attrs: { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' } },
        { type: 'path', attrs: { d: 'M21 3v5h-5' } },
        { type: 'path', attrs: { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' } },
        { type: 'path', attrs: { d: 'M8 16H3v5' } }
    ],
    'ArrowRight': [
        { type: 'line', attrs: { x1: '5', y1: '12', x2: '19', y2: '12' } },
        { type: 'polyline', attrs: { points: '12 5 19 12 12 19' } }
    ],
    'ArrowLeft': [
        { type: 'line', attrs: { x1: '19', y1: '12', x2: '5', y2: '12' } },
        { type: 'polyline', attrs: { points: '12 19 5 12 12 5' } }
    ],
    'ArrowUp': [
        { type: 'line', attrs: { x1: '12', y1: '19', x2: '12', y2: '5' } },
        { type: 'polyline', attrs: { points: '5 12 12 5 19 12' } }
    ],
    'ArrowDown': [
        { type: 'line', attrs: { x1: '12', y1: '5', x2: '12', y2: '19' } },
        { type: 'polyline', attrs: { points: '19 12 12 19 5 12' } }
    ],
    'ChevronDown': [
        { type: 'path', attrs: { d: 'm6 9 6 6 6-6' } }
    ],
    'ChevronUp': [
        { type: 'path', attrs: { d: 'm18 15-6-6-6 6' } }
    ],
    'ChevronLeft': [
        { type: 'path', attrs: { d: 'm15 18-6-6 6-6' } }
    ],
    'ChevronRight': [
        { type: 'path', attrs: { d: 'm9 18 6-6-6-6' } }
    ],
    'Menu': [
        { type: 'line', attrs: { x1: '4', y1: '6', x2: '20', y2: '6' } },
        { type: 'line', attrs: { x1: '4', y1: '12', x2: '20', y2: '12' } },
        { type: 'line', attrs: { x1: '4', y1: '18', x2: '20', y2: '18' } }
    ],
    'Plus': [
        { type: 'line', attrs: { x1: '12', y1: '5', x2: '12', y2: '19' } },
        { type: 'line', attrs: { x1: '5', y1: '12', x2: '19', y2: '12' } }
    ],
    'Minus': [
        { type: 'line', attrs: { x1: '5', y1: '12', x2: '19', y2: '12' } }
    ],
    'X': [
        { type: 'line', attrs: { x1: '18', y1: '6', x2: '6', y2: '18' } },
        { type: 'line', attrs: { x1: '6', y1: '6', x2: '18', y2: '18' } }
    ],
    'Check': [
        { type: 'polyline', attrs: { points: '20 6 9 17 4 12' } }
    ],
    'Eye': [
        { type: 'path', attrs: { d: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' } },
        { type: 'circle', attrs: { cx: '12', cy: '12', r: '3' } }
    ],
    'EyeOff': [
        { type: 'path', attrs: { d: 'M9.88 9.88a3 3 0 1 0 4.24 4.24' } },
        { type: 'path', attrs: { d: 'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68' } },
        { type: 'path', attrs: { d: 'M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61' } },
        { type: 'line', attrs: { x1: '2', y1: '2', x2: '22', y2: '22' } }
    ],
    'Edit': [
        { type: 'path', attrs: { d: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' } }
    ],
    'Trash': [
        { type: 'path', attrs: { d: 'M3 6h18' } },
        { type: 'path', attrs: { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' } },
        { type: 'path', attrs: { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' } }
    ],
    'Shield': [
        { type: 'path', attrs: { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' } }
    ],
    'Award': [
        { type: 'circle', attrs: { cx: '12', cy: '8', r: '6' } },
        { type: 'path', attrs: { d: 'M15.477 12.89 17 22l-5-3-5 3 1.523-9.11' } }
    ],
    'Target': [
        { type: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
        { type: 'circle', attrs: { cx: '12', cy: '12', r: '6' } },
        { type: 'circle', attrs: { cx: '12', cy: '12', r: '2' } }
    ],
    'TrendingUp': [
        { type: 'polyline', attrs: { points: '23 6 13.5 15.5 8.5 10.5 1 18' } },
        { type: 'polyline', attrs: { points: '17 6 23 6 23 12' } }
    ],
    'TrendingDown': [
        { type: 'polyline', attrs: { points: '23 18 13.5 8.5 8.5 13.5 1 6' } },
        { type: 'polyline', attrs: { points: '17 18 23 18 23 12' } }
    ],
    'CreditCard': [
        { type: 'rect', attrs: { width: '20', height: '14', x: '2', y: '5', rx: '2' } },
        { type: 'line', attrs: { x1: '2', y1: '10', x2: '22', y2: '10' } }
    ],
    'DollarSign': [
        { type: 'line', attrs: { x1: '12', y1: '1', x2: '12', y2: '23' } },
        { type: 'path', attrs: { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' } }
    ],
    'Lock': [
        { type: 'rect', attrs: { width: '18', height: '11', x: '3', y: '11', rx: '2', ry: '2' } },
        { type: 'path', attrs: { d: 'M7 11V7a5 5 0 0 1 10 0v4' } }
    ],
    'Unlock': [
        { type: 'rect', attrs: { width: '18', height: '11', x: '3', y: '11', rx: '2', ry: '2' } },
        { type: 'path', attrs: { d: 'M7 11V7a5 5 0 0 1 9.9-1' } }
    ],
    'Globe': [
        { type: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
        { type: 'path', attrs: { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' } },
        { type: 'path', attrs: { d: 'M2 12h20' } }
    ],
    'MessageCircle': [
        { type: 'path', attrs: { d: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z' } }
    ],
    'Bell': [
        { type: 'path', attrs: { d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' } },
        { type: 'path', attrs: { d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' } }
    ],
    'FileText': [
        { type: 'path', attrs: { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' } },
        { type: 'polyline', attrs: { points: '14 2 14 8 20 8' } },
        { type: 'line', attrs: { x1: '16', y1: '13', x2: '8', y2: '13' } },
        { type: 'line', attrs: { x1: '16', y1: '17', x2: '8', y2: '17' } },
        { type: 'line', attrs: { x1: '10', y1: '9', x2: '8', y2: '9' } }
    ],
    'Image': [
        { type: 'rect', attrs: { width: '18', height: '18', x: '3', y: '3', rx: '2', ry: '2' } },
        { type: 'circle', attrs: { cx: '9', cy: '9', r: '2' } },
        { type: 'path', attrs: { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' } }
    ],
    'Video': [
        { type: 'path', attrs: { d: 'm22 8-6 4 6 4V8Z' } },
        { type: 'rect', attrs: { width: '14', height: '12', x: '2', y: '6', rx: '2', ry: '2' } }
    ],
    'Music': [
        { type: 'path', attrs: { d: 'M9 18V5l12-2v13' } },
        { type: 'circle', attrs: { cx: '6', cy: '18', r: '3' } },
        { type: 'circle', attrs: { cx: '18', cy: '16', r: '3' } }
    ],
    'Headphones': [
        { type: 'path', attrs: { d: 'M3 18v-6a9 9 0 0 1 18 0v6' } },
        { type: 'path', attrs: { d: 'M21 19a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2z' } },
        { type: 'path', attrs: { d: 'M3 19a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z' } }
    ],
    'Mic': [
        { type: 'path', attrs: { d: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' } },
        { type: 'path', attrs: { d: 'M19 10v2a7 7 0 0 1-14 0v-2' } },
        { type: 'line', attrs: { x1: '12', y1: '19', x2: '12', y2: '23' } },
        { type: 'line', attrs: { x1: '8', y1: '23', x2: '16', y2: '23' } }
    ],
    'Wifi': [
        { type: 'path', attrs: { d: 'M5 12.55a11 11 0 0 1 14.08 0' } },
        { type: 'path', attrs: { d: 'M1.42 9a16 16 0 0 1 21.16 0' } },
        { type: 'path', attrs: { d: 'M8.53 16.11a6 6 0 0 1 6.95 0' } },
        { type: 'line', attrs: { x1: '12', y1: '20', x2: '12.01', y2: '20' } }
    ],
    'Bluetooth': [
        { type: 'path', attrs: { d: 'm7 7 10 10-5 5V2l5 5-10 10' } }
    ],
    'Cast': [
        { type: 'path', attrs: { d: 'M4 22V2l20 20Z' } },
        { type: 'path', attrs: { d: 'm16 6-10 10' } },
        { type: 'path', attrs: { d: 'm16 10-6 6' } },
        { type: 'path', attrs: { d: 'm16 14-2 2' } }
    ],
    'Share': [
        { type: 'path', attrs: { d: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' } },
        { type: 'polyline', attrs: { points: '16 6 12 2 8 6' } },
        { type: 'line', attrs: { x1: '12', y1: '2', x2: '12', y2: '15' } }
    ],
    'Link': [
        { type: 'path', attrs: { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' } },
        { type: 'path', attrs: { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' } }
    ],
    'Copy': [
        { type: 'rect', attrs: { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' } },
        { type: 'path', attrs: { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' } }
    ],
    'Scissors': [
        { type: 'circle', attrs: { cx: '6', cy: '6', r: '3' } },
        { type: 'circle', attrs: { cx: '6', cy: '18', r: '3' } },
        { type: 'line', attrs: { x1: '20', y1: '4', x2: '8.12', y2: '15.88' } },
        { type: 'line', attrs: { x1: '14.47', y1: '14.48', x2: '20', y2: '20' } },
        { type: 'line', attrs: { x1: '8.12', y1: '8.12', x2: '12', y2: '12' } }
    ],
    'Moon': [
        { type: 'path', attrs: { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' } }
    ],
    'Sun': [
        { type: 'circle', attrs: { cx: '12', cy: '12', r: '4' } },
        { type: 'path', attrs: { d: 'M12 2v2' } },
        { type: 'path', attrs: { d: 'M12 20v2' } },
        { type: 'path', attrs: { d: 'm4.93 4.93 1.41 1.41' } },
        { type: 'path', attrs: { d: 'm17.66 17.66 1.41 1.41' } },
        { type: 'path', attrs: { d: 'M2 12h2' } },
        { type: 'path', attrs: { d: 'M20 12h2' } },
        { type: 'path', attrs: { d: 'm6.34 17.66-1.41 1.41' } },
        { type: 'path', attrs: { d: 'm19.07 4.93-1.41 1.41' } }
    ],
    'Cloud': [
        { type: 'path', attrs: { d: 'M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3s1.3 3 3 3h11c1.7 0 3-1.3 3-3z' } },
        { type: 'path', attrs: { d: 'M14.5 5c-2.5 0-4.5 2-4.5 4.5' } },
        { type: 'path', attrs: { d: 'M18 9.5A4.5 4.5 0 0 0 13.5 5' } }
    ],
    'Umbrella': [
        { type: 'path', attrs: { d: 'M22 12a10.06 10.06 0 0 0-10-10A10.06 10.06 0 0 0 2 12' } },
        { type: 'path', attrs: { d: 'M12 12v9a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2' } }
    ],
    'Facebook': [
        { type: 'path', attrs: { d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' } }
    ],
    'Twitter': [
        { type: 'path', attrs: { d: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' } }
    ],
    'Instagram': [
        { type: 'rect', attrs: { width: '20', height: '20', x: '2', y: '2', rx: '5', ry: '5' } },
        { type: 'path', attrs: { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' } },
        { type: 'line', attrs: { x1: '17.5', y1: '6.5', x2: '17.51', y2: '6.5' } }
    ],
    'Youtube': [
        { type: 'path', attrs: { d: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z' } },
        { type: 'polygon', attrs: { points: '9.75 15.02 15.5 12 9.75 8.98 9.75 15.02' } }
    ],
    'Linkedin': [
        { type: 'path', attrs: { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z' } },
        { type: 'rect', attrs: { width: '4', height: '12', x: '2', y: '9' } },
        { type: 'circle', attrs: { cx: '4', cy: '4', r: '2' } }
    ],
    'Github': [
        { type: 'path', attrs: { d: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' } }
    ]
};

// Helper function to generate SVG HTML from icon data
const getIconSVGHTML = (iconName: string): string => {
    // Try newer multi-element SVG map first
    if (LUCIDE_ICON_SVGS[iconName]) {
        const iconElements = LUCIDE_ICON_SVGS[iconName];
        return iconElements.map(el => {
            const attrs = Object.entries(el.attrs || {}).map(([k, v]) => `${k}="${v}"`).join(' ');

            if (el.type === 'path') {
                return `<path ${attrs} />`;
            } else if (el.type === 'circle') {
                return `<circle ${attrs} />`;
            } else if (el.type === 'polyline') {
                return `<polyline ${attrs} />`;
            } else if (el.type === 'line') {
                return `<line ${attrs} />`;
            } else if (el.type === 'rect') {
                return `<rect ${attrs} />`;
            } else if (el.type === 'polygon') {
                return `<polygon ${attrs} />`;
            }
            return '';
        }).join('\n                            ');
    }

    // Fallback to legacy single-path icon map
    const path = LUCIDE_ICON_PATHS[iconName] || LUCIDE_ICON_PATHS['Zap'];
    return `<path d="${path}" />`;
};

// Keep the old single-path version for simple icons (backward compatibility)
const LUCIDE_ICON_PATHS: { [key: string]: string } = {
    'Truck': 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2 M15 18H9 M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14 M17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
    'Ship': 'M2 12h20M2 12l2-2m-2 2l2 2M2 12h6l3-3m-3 3h4l2-2m-2 2l2 2m2-10V7a2 2 0 012-2h6a2 2 0 012 2v5 M16.5 18.5l-2.226-2.226 M16.5 18.5l2.226-2.226',
    'Zap': 'M13 2L3 14h9l-1 6h6l1-6h9L13 2z',
    'Package': 'M16.5 9.4l-7.5 7.5-3.5-3.5 7.5-7.5 M16.5 9.4l-2.226-2.226 M16.5 9.4l2.226 2.226 M9 11.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z m8.5 0a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z',
    'Home': 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    'User': 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
    'Settings': 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 0 .07.53c.07.2.38.22.66.43.84.42 1.07.16 1.54.3 2.01a2 2 0 0 0 .45 2.72l.06.13a2 2 0 0 0 .91 2.58c.24.55.65.86 1.2.95 1.63a2 2 0 0 0 .3 1.07v.35a2 2 0 0 0 .42.51 2.54 2.54 0 0 0 .3 1.3 2 2 0 0 0 .3 1.3 2 2 0 0 0 .42-.51 2-2 0 0 0 .3-1.3 2-2 0 0 0 .3-1.3.42-.51 2-2 0 0 0-.3-1.3 2-2 0 0 0-.42.51 2-.54.3-.97-.88-1.63a2 2 0 0 0-.3-1.07v-.35a2 2 0 0 0-.45-2.72 2 2 0 0 0-.91-2.58c-.24-.55-.65-.86-1.2-.95-1.63a2 2 0 0 0-.3-1.3v-.18a2 2 0 0 0-2-2h-.44zM7.78 21a2 2 0 0 1-2-2v-.18a2 2 0 0 0-.07-.53 2 2 0 0 0-.42-.51 2 2 0 0 0-.3-1.07 2 2 0 0 0-.45-2.72l-.06-.13a2 2 0 0 0-.91-2.58 2 2 0 0 0-.95-1.63 2 2 0 0 0-.3-2.01v-.35a2 2 0 0 0-.42-.51 2.54 2.54 0 0 0-.3-1.3 2-2 0 0 0-.3-1.3 2-2 0 0 0-.42.51 2-.54-.3-.97-.88-1.63a2 2 0 0 0-.3-1.07v-.35a2 2 0 0 0-.45-2.72 2 2 0 0 0-.91-2.58c-.24-.55-.65-.86-1.2-.95-1.63a2 2 0 0 0-.3-1.3 2 2 0 0 0-.42.51 2-.54.3-.97.88-1.63 2 2 0 0 0-.3-1.07v-.35a2 2 0 0 0-2-2h-.44z',
    'ShoppingCart': 'm9 25a6 6 0 0 1 6 6v7a6 6 0 0 1-6 6v-7a6 6 0 0 1 6-6zm11.666-2h-2.664a4 4 0 0 1-1.768-3.563l-5.052-5.632A4 4 0 0 1 9.635 8h4.57a4 4 0 0 1 3.992 4',
    'Layout': 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
    'Heart': 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    'Star': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    'CheckCircle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14',
    'XCircle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14',
    'AlertCircle': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    'Info': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    'Mail': 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
    'Phone': 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    'MapPin': 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z',
    'Clock': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    'Calendar': 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z',
    'Search': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    'Filter': 'M20 10H4m16 0l-4 4m4-4-4 4M4 10l4 4m-4-4 4-4m12 6H4m16 0l-4-4m4 4-4 4',
    'Download': 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m7 10l5-5m-5 5l5-5m-5 5V3',
    'Upload': 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m17-7l-5-5m5 5l-5-5m5 5H3',
    'RefreshCw': 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8m0 0v5m0-5h-5m-2 4a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16m0 0v-5m0 5h5',
    'ArrowRight': 'M5 12h14m-7-7 7 7-7 7',
    'ArrowLeft': 'M19 12H5m7-7-7 7 7 7',
    'ArrowUp': 'M12 19V5m0 0l-7 7m7-7 7 7',
    'ArrowDown': 'M12 5v14m0 0l7-7m-7 7-7-7',
    'ChevronDown': 'm6 9 6 6 6-6',
    'ChevronUp': 'm18 15-6-6-6 6',
    'ChevronLeft': 'm15 18-6-6 6-6',
    'ChevronRight': 'm9 18 6-6-6-6',
    'Menu': 'M4 6h16M4 12h16M4 18h16',
    'Plus': 'M12 5v14m-7-7h14',
    'Minus': 'M5 12h14',
    'Eye': 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z M12 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6z',
    'EyeOff': 'M9.9 17c-.9.4-2.2-.5-3.4-.5C4 16.5 2 12 2 12s2-4.5 4.5-4.5c1.2 0 2.5.1 3.4.5 M9.9 12L3.5 5.5 M14.1 17c.9.4 2.2.5 3.4.5 2.5 0 4.5-4.5 4.5-4.5s-2-4.5-4.5-4.5c-1.2 0-2.5.1-3.4.5 M14.1 12l6.4 6.4',
    'Edit': 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-9 1 8.5-8.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z',
    'Trash2': 'M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-6v6',
    'Share2': 'M8 18c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4m8 0c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4m-8 6c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4m8-2c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4',
    'Link': 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
    'Globe': 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z M2 12h20',
    'Facebook': 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    'Twitter': 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z',
    'Instagram': 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01',
    'Youtube': 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z M9.75 15.02l5.75-3.27-5.75-3.27z',
    'Linkedin': 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 2a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2z',
    'HelpCircle': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01',
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
        case BLOCK_TYPES.LOOP_GRID:
            return {
                ...base,
                heading: 'Popular',
                headingHighlight: 'Faculties',
                highlightColor: '#d2152a',
                description: 'Discover the most sought-after subjects to kickstart your study in the UK journey.',
                items: [
                    { title: 'Business & Management', image: 'https://images.unsplash.com/photo-1454165833767-1319d3bb763c?auto=format&fit=crop&q=80&w=200' },
                    { title: 'Computing', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=200' },
                    { title: 'Engineering', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=200' },
                    { title: 'Law', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=200' },
                    { title: 'Nursing and Midwifery', image: 'https://images.unsplash.com/photo-1505751172107-573225a94042?auto=format&fit=crop&q=80&w=200' },
                    { title: 'Allied Health', image: 'https://images.unsplash.com/photo-1576091160550-2173bdd99621?auto=format&fit=crop&q=80&w=200' },
                    { title: 'Medicine & Dentistry', image: 'https://images.unsplash.com/photo-1559839734-2b71db197ec2?auto=format&fit=crop&q=80&w=200' },
                    { title: 'Psychology', image: 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=200' },
                    { title: 'Medical Sciences', image: 'https://images.unsplash.com/photo-1532187875605-1ef6c1a06709?auto=format&fit=crop&q=80&w=200' },
                    { title: 'Architecture', image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&q=80&w=200' },
                    { title: 'Explore All', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=200' }
                ],
                styles: { ...defaultBlockStyles, backgroundColor: '#ffffff', paddingTop: 60, paddingBottom: 120, backgroundImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200' }
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
                        backgroundImage: (block.styles?.backgroundImages && block.styles?.backgroundImages.length > 0)
                            ? block.styles?.backgroundImages.map((img: string) => `url(${img})`).join(', ')
                            : (block.styles?.backgroundImage ? `url(${block.styles?.backgroundImage})` : 'none'),
                        backgroundPosition: (block.styles?.backgroundImages && block.styles?.backgroundImages.length > 0)
                            ? (block.styles?.backgroundPositions || []).map((pos: string) => pos || 'center center').join(', ')
                            : 'center center',
                        backgroundSize: (block.styles?.backgroundImages && block.styles?.backgroundImages.length > 0)
                            ? (block.styles?.backgroundSizes || []).map((size: string) => size || 'cover').join(', ')
                            : (block.styles?.backgroundSize || 'cover'),
                        backgroundRepeat: (block.styles?.backgroundImages && block.styles?.backgroundImages.length > 0)
                            ? (block.styles?.backgroundRepeats || []).map((rep: string) => rep || 'no-repeat').join(', ')
                            : 'no-repeat',
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
            <BlockRenderer block={block} onUpdateContent={updateBlockContent} viewMode={viewMode} />
        </div>
    );
}

// ─────────────────────────────────────────
//  FAQ Section Renderer (with collapse state)
// ─────────────────────────────────────────
function FAQSectionRenderer({ block, viewMode, containerStyle }: { block: any, viewMode?: string, containerStyle: any }) {
    const [openIndex, setOpenIndex] = React.useState<number | null>(0);

    return (
        <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={containerStyle}>
            <div className="faq-section spacer py-10 px-4">
                <h2 className="title text-center">
                    {block.heading}{' '}
                    <span style={{ color: block.highlightColor || '#ffb300' }}>({block.headingHighlight || 'FAQs'})</span>
                </h2>
                <div className={`flex gap-10 items-center text-left mt-8 ${viewMode === 'mobile' ? 'flex-col' : 'md:flex-row'}`}>
                    <div className="shrink-0 flex justify-center w-full md:w-auto">
                        <div className="w-80 h-80 rounded-full overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                            <img src={block.imageUrl} alt="FAQ" className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                        </div>
                    </div>
                    <div className="flex-1 w-full space-y-3">
                        {(block.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                                <div
                                    className="p-4 flex justify-between items-center bg-white cursor-pointer hover:bg-slate-50/50 transition-colors"
                                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                >
                                    <span className="font-semibold text-slate-700 text-[15px]">{item.question}</span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`} />
                                </div>
                                {openIndex === idx && (
                                    <div className="px-[18px] pb-4 text-sm text-slate-500 leading-relaxed animate-in slide-in-from-top-2 duration-300">
                                        {item.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────
//  Loop Grid Renderer
// ─────────────────────────────────────────
function LoopGridRenderer({ block, containerStyle, isMobile }: { block: any, containerStyle: any, isMobile: boolean }) {
    const s = block.styles || {};
    return (
        <div
            id={block.customId || `blk-${block.id}`}
            className={cn("relative overflow-hidden", block.customClass)}
            style={{ ...containerStyle, '--highlight-color': block.highlightColor || '#d2152a' } as React.CSSProperties}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12 spacer">
                    <h2 className="title">
                        {block.heading}{' '}
                        <span style={{ color: 'var(--highlight-color)' }}>{block.headingHighlight}</span>
                    </h2>
                    {block.description && (
                        <p className="paragraph mx-auto">
                            {block.description}
                        </p>
                    )}
                </div>

                <div className={cn(
                    "grid gap-6",
                    isMobile ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4"
                )}>
                    {(block.items || []).map((item: any, idx: number) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-50 group hover:-translate-y-1"
                        >
                            <div className="w-20 h-20 mb-4 overflow-hidden rounded-xl flex items-center justify-center bg-slate-50">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                        <ImageIcon className="w-10 h-10" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">
                                {item.title}
                            </h3>
                        </div>
                    ))}
                </div>
            </div>

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
        backgroundImage: (s.backgroundImages && s.backgroundImages.length > 0)
            ? s.backgroundImages.map((img: string) => `url(${img})`).join(', ')
            : (s.backgroundImage ? `url(${s.backgroundImage})` : 'none'),
        backgroundPosition: (s.backgroundImages && s.backgroundImages.length > 0)
            ? (s.backgroundPositions || []).map((pos: string) => pos || 'center center').join(', ')
            : 'center center',
        backgroundSize: (s.backgroundImages && s.backgroundImages.length > 0)
            ? (s.backgroundSizes || []).map((size: string) => size || 'cover').join(', ')
            : (s.backgroundSize || 'cover'),
        backgroundRepeat: (s.backgroundImages && s.backgroundImages.length > 0)
            ? (s.backgroundRepeats || []).map((rep: string) => rep || 'no-repeat').join(', ')
            : 'no-repeat',
        position: 'relative' as const,
        overflow: 'hidden' as const,
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

    // Helper to wrap content with parentClass if needed
    const wrapWithParentClass = (content: React.ReactNode) => {
        if (block.parentClass) {
            return <div className={block.parentClass}>{content}</div>;
        }
        return content;
    };

    // Always apply containerStyle (padding, margin, background, etc.)
    const divStyle = containerStyle;

    switch (block.type) {
        case BLOCK_TYPES.TEXT:
        case BLOCK_TYPES.HEADING:
        case BLOCK_TYPES.LIST:
            return wrapWithParentClass(
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={divStyle}>
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
            return wrapWithParentClass(
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={divStyle}>
                    <img src={block.src} alt={block.alt} className="w-full object-cover" style={{ borderRadius: s.borderRadius }} />
                </div>
            );
        case BLOCK_TYPES.BUTTON:
            return wrapWithParentClass(
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
            return wrapWithParentClass(
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={divStyle}>
                    <hr style={{ borderColor: s.color || '#e2e8f0' }} />
                </div>
            );
        case BLOCK_TYPES.SPACER:
            return <div style={{ height: block.height || 40, ...divStyle }} className="border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 text-xs font-mono page-block-renderer">spacer · {block.height || 40}px</div>;

        case BLOCK_TYPES.ICON_BOX:
            return wrapWithParentClass(
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={divStyle}>
                    <div className="flex flex-col items-center">
                        <IconComponent icon={block.icon || 'Layout'} className="w-10 h-10 mb-2" />
                        <h3 className="font-bold">{block.title}</h3>
                        <p className="text-sm opacity-80">{block.description}</p>
                    </div>
                </div>
            );

        case BLOCK_TYPES.ACCORDION:
            return wrapWithParentClass(
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={divStyle}>
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
            return wrapWithParentClass(
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={divStyle}>
                    <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        Video Placeholder: {block.url || 'No URL'}
                    </div>
                </div>
            );

        case BLOCK_TYPES.SOCIAL:
            return wrapWithParentClass(
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={divStyle}>
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
            return wrapWithParentClass(
                <FAQSectionRenderer block={block} viewMode={viewMode} containerStyle={divStyle} />
            );

        case BLOCK_TYPES.FEATURE_SECTION:
            return wrapWithParentClass(
                <div id={block.customId || `blk-${block.id}`} className={`${block.customClass || ''}`} style={divStyle}>
                    <div className="feature-section flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl">
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

                        <div className="w-full md:w-1/2 p-6 md:p-10 bg-white md:bg-transparent flex items-center justify-center md:-mt-8 md:mt-0 md:-ml-12 z-10">
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

        case BLOCK_TYPES.LOOP_GRID:
            return wrapWithParentClass(
                <LoopGridRenderer
                    block={block}
                    containerStyle={divStyle}
                    isMobile={viewMode === 'mobile'}
                />
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
    const bgImageCSS = (s.backgroundImages && s.backgroundImages.length > 0)
        ? `background-image:${s.backgroundImages.map((img: string) => `url(${img})`).join(', ')};background-position:${(s.backgroundPositions || []).map((pos: string) => pos || 'center center').join(', ')};background-size:${(s.backgroundSizes || []).map((size: string) => size || 'cover').join(', ')};background-repeat:${(s.backgroundRepeats || []).map((rep: string) => rep || 'no-repeat').join(', ')};`
        : (s.backgroundImage ? `background-image:url(${s.backgroundImage});background-size:cover;background-position:center;background-repeat:no-repeat;` : '');
    const backgroundCSS = `background-color:${s.backgroundColor || 'transparent'};${bgImageCSS}`;
    const borderRadiusCSS = `border-radius:${s.borderRadius || 0}px;`;

    const wrap = (content: string) => {
        // parentClass goes on a wrapper div, customClass goes on the content div
        const wrapperStyle = `padding:${s.paddingTop || 0}px ${s.paddingRight || 0}px ${s.paddingBottom || 0}px ${s.paddingLeft || 0}px;${backgroundCSS}${borderRadiusCSS}box-sizing:border-box;${marginCSS}${borderCSS}position:relative;overflow:hidden;`;

        let result = content;
        if (block.parentClass) {
            result = `<div class="${block.parentClass}">${result}</div>`;
        }

        // Wrap with the styled div that has customId and customClass
        return `<div id="${block.customId || `blk-${block.id}`}" class="${block.customClass || ''}" style="${wrapperStyle}">${result}</div>`;
    };

    switch (block.type) {
        case BLOCK_TYPES.TEXT:
        case BLOCK_TYPES.HEADING:
        case BLOCK_TYPES.LIST: {
            const extraStyles = [
                block.type === BLOCK_TYPES.LIST ? `#block-${block.id} li::marker { color: ${s.bulletColor || s.color || '#00c3c0'}; }` : '',
                `#block-${block.id} p { margin-bottom: ${s.paragraphSpacing ?? 16}px; padding: ${s.paragraphPadding ?? 0}px; margin-top: 0; }`,
                `#block-${block.id} p:last-child { margin-bottom: 0; }`,
                `#block-${block.id} ul, #block-${block.id} ol { list-style-position: inside; padding-left: 0; margin: 0; text-align: ${s.textAlign || 'left'}; }`,
                `#block-${block.id} li { text-align: ${s.textAlign || 'left'}; margin-bottom: ${s.listItemSpacing ?? 0}px !important; }`,
                `#block-${block.id} li:last-child { margin-bottom: 0 !important; }`,
                block.type === BLOCK_TYPES.HEADING ? `
                    #block-${block.id} h2 {
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
            const listIdAttr = `id="block-${block.id}"`;
            const content = `<style>${extraStyles}</style><div ${listIdAttr} style="color:${s.color};font-size:${s.fontSize}px;line-height:${s.lineHeight || 1.5};letter-spacing:${s.letterSpacing || 0}px;text-transform:${s.textTransform || 'none'};text-align:${s.textAlign};font-weight:${s.fontWeight || 'normal'};font-style:${s.fontStyle || 'normal'};text-decoration:${s.textDecoration || 'none'};">${block.content}</div>`;
            return wrap(content);
        }
        case BLOCK_TYPES.IMAGE:
            return wrap(`<img src="${block.src}" alt="${block.alt}" style="width:100%;display:block;border-radius:${s.borderRadius || 0}px;" />`);
        case BLOCK_TYPES.BUTTON:
            return wrap(`<div style="display:flex;justify-content:${s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'flex-end' : 'flex-start'};"><a href="${block.url}" target="${block.target || '_self'}" style="background-color:${s.backgroundColor};color:${s.color};border-radius:${s.borderRadius}px;font-size:${s.fontSize}px;padding:${s.buttonPaddingY || 10}px ${s.buttonPaddingX || 28}px;display:inline-block;font-weight:700;text-decoration:none;white-space:nowrap;">${block.text}</a></div>`);
        case BLOCK_TYPES.DIVIDER:
            return wrap(`<hr style="border:none;border-top:1px solid ${s.color || '#e2e8f0'};" />`);
        case BLOCK_TYPES.SPACER:
            return wrap(`<div style="height:${block.height || 40}px;"></div>`);
        case BLOCK_TYPES.COLUMNS: {
            const colHTMLs = block.columns.map((col: any) => {
                const childHTML = col.blocks.map(blockToHTML).join('');
                return `<div class="col-block" style="flex:${col.ratio};padding:4px;min-width:0;">${childHTML}</div>`;
            }).join('');
            return wrap(`<div class="col-row" style="display:flex;gap:8px;flex-wrap:wrap;">${colHTMLs}</div>`);
        }
        case BLOCK_TYPES.ICON_BOX: {
            return wrap(`
                <div style="text-align: ${s.textAlign || 'center'};">
                    <div style="margin-bottom: 10px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 40px; height: 40px;">
                            ${getIconSVGHTML(block.icon || 'Layout')}
                        </svg>
                    </div>
                    <h3 style="margin: 0 0 5px; font-size: 18px; font-weight: bold;">${block.title}</h3>
                    <p style="margin: 0; font-size: 14px; opacity: 0.8;">${block.description}</p>
                </div>
            `);
        }
        case BLOCK_TYPES.ACCORDION:
            const accItems = (block.items || []).map((item: any) => `
                <div style="margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="padding: 12px; background: #f8fafc; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
                        ${item.title}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </div>
                </div>
            `).join('');
            return wrap(`<div>${accItems}</div>`);
        case BLOCK_TYPES.VIDEO:
            return wrap(`<div style="background: #0f172a; color: #fff; padding: 60px 40px; text-align: center; border-radius: 8px; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;">Video Placeholder: ${block.url || 'No URL'}</div>`);
        case BLOCK_TYPES.SOCIAL: {
            const socialItems = (block.items || []).map((item: any) => {
                const iconSVG = getIconSVGHTML(item.icon || 'Link');

                return `
                <a href="${item.url}" style="display: inline-flex; margin: 0 8px; text-decoration: none; padding: 8px; background: #f1f5f9; border-radius: 50%;" target="_blank">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                        ${iconSVG}
                    </svg>
                </a>
            `}).join('');
            return wrap(`<div style="text-align: ${s.textAlign || 'center'};">${socialItems}</div>`);
        }
        case BLOCK_TYPES.FAQ_SECTION: {
            const itemsHTML = (block.items || []).map((item: any, idx: number) => {
                const isFirstItem = idx === 0;
                return `
                <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                    <div class="p-4 flex justify-between items-center bg-white cursor-pointer hover:bg-slate-50/50 transition-colors" onclick="if(this.nextElementSibling.style.display==='none'){this.nextElementSibling.style.display='block';this.querySelector('svg').style.transform='rotate(180deg)'}else{this.nextElementSibling.style.display='none';this.querySelector('svg').style.transform='rotate(0deg)'}">
                        <span class="font-semibold text-slate-700 text-[15px]">${item.question}</span>
                        <svg class="w-4 h-4 text-slate-400 transition-transform duration-300" style="transform: ${isFirstItem ? 'rotate(180deg)' : 'rotate(0deg)'}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </div>
                    <div class="px-[18px] pb-4 text-sm text-slate-500 leading-relaxed" style="display: ${isFirstItem ? 'block' : 'none'};">
                        ${item.answer}
                    </div>
                </div>
            `}).join('');

            const content = `
                <div class="faq-section spacer py-10 px-4">
                    <h2 class="title text-center">
                        ${block.heading} <span style="color: ${block.highlightColor || '#ffb300'}">(${block.headingHighlight || 'FAQs'})</span>
                    </h2>
                    <div class="flex flex-col md:flex-row gap-10 items-center text-left mt-8">
                        <div class="shrink-0 flex justify-center w-full md:w-auto">
                            <div class="w-80 h-80 rounded-full overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                                <img src="${block.imageUrl}" alt="FAQ" class="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                            </div>
                        </div>
                        <div class="flex-1 w-full space-y-3">
                            ${itemsHTML}
                        </div>
                    </div>
                </div>
            `;
            return wrap(content);
        }
        case BLOCK_TYPES.FEATURE_SECTION: {
            const featuresHTML = (block.items || []).map((item: any) => {
                return `
                <div class="feature-card bg-white p-5 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-5 transform hover:scale-[1.03] transition-all hover:shadow-2xl group">
                    <div class="w-14 h-14 shrink-0 rounded-2xl bg-slate-50 text-slate-800 flex items-center justify-center p-3 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            ${getIconSVGHTML(item.icon || 'Zap')}
                        </svg>
                    </div>
                    <div class="flex flex-col">
                        <h4 class="font-black text-slate-800 text-sm mb-0.5">${item.title}</h4>
                        <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-[#00c3c0] transition-colors">${item.subtitle}</span>
                    </div>
                </div>
            `}).join('');

            const content = `
                <div class="feature-section flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl">
                    <div class="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center text-white relative" style="background: linear-gradient(135deg, ${block.gradientStart || '#0a1d56'} 0%, ${block.gradientEnd || '#d2152a'} 100%);">
                        <div class="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-[-15deg] translate-x-16 pointer-events-none"></div>
                        <div class="spacer">
                            <h3 class="subtitle">${block.subtitle}</h3>
                            <h2 class="title">${block.title}</h2>
                            <p class="paragraph">${block.description}</p>
                        </div>
                    </div>
                    <div class="w-full md:w-1/2 p-6 md:p-10 bg-white md:bg-transparent flex items-center justify-center md:-mt-8 md:mt-0 md:-ml-12 z-10">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                            ${featuresHTML}
                        </div>
                    </div>
                </div>
            `;
            return wrap(content);
        }
        case BLOCK_TYPES.LOOP_GRID: {
            const itemsHTML = (block.items || []).map((item: any) => `
                <div class="bg-white rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-50 group hover:-translate-y-1">
                    <div class="w-20 h-20 mb-4 overflow-hidden rounded-xl flex items-center justify-center bg-slate-50">
                        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />` : ''}
                    </div>
                    <h3 class="text-lg font-bold text-slate-800 leading-tight">${item.title}</h3>
                </div>
            `).join('');

            const content = `
                <div class="spacer text-center relative z-10" style="--highlight-color: ${block.highlightColor || '#d2152a'}">
                        <h2 class="title">
                            ${block.heading} <span style="color: var(--highlight-color)">${block.headingHighlight}</span>
                        </h2>
                        ${block.description ? `<p class="paragraph mx-auto">${block.description}</p>` : ''}
                    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 loop-grid-container">
                        ${itemsHTML}
                    </div>
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
    // REMOVED: Global CSS reset that was breaking the entire page layout
    // The `* { margin: 0; padding: 0; box-sizing: border-box; }` was affecting
    // the entire page (header, footer, navigation), not just the page content.
    const responsiveCSS = `<style>
        @media only screen and (max-width:600px){
            .page-content .col-row{flex-direction:column!important;}
            .page-content .col-block{width:100%!important;}
        }
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

    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
    const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);

    const openMediaModal = (index: number, key: string) => {
        setActiveItemIndex(index);
        setActiveFieldKey(key);
        setMediaModalOpen(true);
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
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateItem(idx, f.key, e.target.value)}
                                        />
                                    ) : f.type === 'icon' ? (
                                        <div className="flex items-center gap-2">
                                            <IconSelector
                                                value={item[f.key] || ''}
                                                onChange={(icon) => updateItem(idx, f.key, icon)}
                                            />
                                            <Input
                                                className="h-9 text-xs rounded-xl bg-white border-slate-200 flex-1"
                                                value={item[f.key] || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(idx, f.key, e.target.value)}
                                                placeholder="Or type icon name..."
                                            />
                                        </div>
                                    ) : f.type === 'image' ? (
                                        <div className="flex gap-2">
                                            <Input
                                                className="h-9 text-xs rounded-xl bg-white border-slate-200 flex-1"
                                                value={item[f.key] || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(idx, f.key, e.target.value)}
                                                placeholder="https://..."
                                            />
                                            <Button
                                                onClick={() => openMediaModal(idx, f.key)}
                                                variant="outline"
                                                className="shrink-0 h-9 w-9 bg-white border-slate-200 rounded-xl flex items-center justify-center p-0 hover:bg-slate-50"
                                            >
                                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Input
                                            className="h-9 text-xs rounded-xl bg-white border-slate-200"
                                            value={item[f.key] || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(idx, f.key, e.target.value)}
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

            <MediaLibraryModal
                open={mediaModalOpen}
                onOpenChange={setMediaModalOpen}
                onSelect={(url) => {
                    if (activeItemIndex !== null && activeFieldKey !== null) {
                        updateItem(activeItemIndex, activeFieldKey, url);
                    }
                }}
            />
        </div>
    );
}

// ─────────────────────────────────────────
//  Icon Selector Component
// ─────────────────────────────────────────
interface IconSelectorProps {
    value: string;
    onChange: (icon: string) => void;
}

const COMMON_ICONS = [
    'Truck', 'Ship', 'Package', 'Home', 'User', 'Settings', 'Zap', 'ShoppingCart',
    'Heart', 'Star', 'CheckCircle', 'XCircle', 'AlertCircle', 'Info',
    'Mail', 'Phone', 'MapPin', 'Clock', 'Calendar', 'Search', 'Filter',
    'Download', 'Upload', 'RefreshCw', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
    'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 'Menu', 'X',
    'Plus', 'Minus', 'Check', 'Eye', 'EyeOff', 'Edit', 'Trash', 'Share', 'Link',
    'Globe', 'Shield', 'Award', 'Target', 'TrendingUp', 'TrendingDown',
    'CreditCard', 'DollarSign', 'Lock', 'Unlock',
    'Facebook', 'Twitter', 'Instagram', 'Youtube', 'Linkedin', 'Github',
    'MessageCircle', 'Bell', 'FileText', 'Image', 'Video', 'Music', 'Headphones', 'Mic',
    'Wifi', 'Bluetooth', 'Cast', 'Copy', 'Scissors',
    'Moon', 'Sun', 'Cloud', 'Umbrella'
];

function IconSelector({ value, onChange }: IconSelectorProps) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredIcons = search
        ? COMMON_ICONS.filter(icon => icon.toLowerCase().includes(search.toLowerCase()))
        : COMMON_ICONS;

    return (
        <div className="relative">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 p-0 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                type="button"
            >
                {value ? <IconComponent icon={value} className="w-5 h-5 text-slate-600" /> : <Plus className="w-4 h-4 text-slate-400" />}
            </Button>

            {isOpen && (
                <div className="absolute z-50 left-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-80 max-h-80 overflow-hidden">
                    <Input
                        placeholder="Search icons..."
                        value={search}
                        onChange={(e: any) => setSearch(e.target.value)}
                        className="mb-3"
                        autoFocus
                    />
                    <div className="grid grid-cols-6 gap-2 overflow-y-auto max-h-60">
                        {filteredIcons.map((icon) => (
                            <button
                                key={icon}
                                onClick={() => {
                                    onChange(icon);
                                    setIsOpen(false);
                                }}
                                className={`p-2 rounded-lg border transition-all flex items-center justify-center ${value === icon
                                    ? 'bg-[#00c3c0]/10 border-[#00c3c0] text-[#00c3c0]'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                title={icon}
                                type="button"
                            >
                                <IconComponent icon={icon} className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
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
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

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
    const setStyles = (updates: Record<string, any>) => {
        onUpdate(block.id, { styles: { ...(block.styles || {}), ...updates } });
    };
    const setContent = (updates: Record<string, any>) => {
        onUpdate(block.id, updates);
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
                                        value={block.content || ''}
                                        onChange={(e: any) => setContent({ content: e.target.value })}
                                    />
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.IMAGE && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Image Source</Label>
                                        <div className="flex gap-2">
                                            <Input className="h-10 text-xs rounded-xl flex-1" placeholder="https://..." value={block.src || ''} onChange={(e: any) => setContent({ src: e.target.value })} />
                                            <Button
                                                onClick={() => setActiveMediaField('src')}
                                                variant="outline"
                                                className="shrink-0 h-10 w-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all p-0 shadow-sm hover:scale-105 active:scale-95"
                                            >
                                                <ImageIcon className="w-4 h-4 text-[#ff8602]" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alt Text</Label>
                                        <Input className="h-10 text-xs rounded-xl" value={block.alt || ''} onChange={(e: any) => setContent({ alt: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.BUTTON && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Label Text</Label>
                                        <Input className="h-10 text-xs rounded-xl font-bold" value={block.text || ''} onChange={(e: any) => setContent({ text: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Action URL</Label>
                                        <div className="relative">
                                            <Input className="h-10 text-xs rounded-xl pl-9" value={block.url || ''} onChange={(e: any) => setContent({ url: e.target.value })} />
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
                                        <Input className="h-10 text-xs rounded-xl" placeholder="Lucide icon name" value={block.icon || ''} onChange={(e: any) => setContent({ icon: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Title</Label>
                                        <Input className="h-10 text-xs rounded-xl font-bold" value={block.title || ''} onChange={(e: any) => setContent({ title: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</Label>
                                        <textarea className="w-full h-24 p-4 text-xs bg-slate-50 border border-slate-200 rounded-2xl resize-none outline-none focus:ring-2 focus:ring-[#ff8602]/20" value={block.description || ''} onChange={(e: any) => setContent({ description: e.target.value })} />
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
                                            { key: 'icon', label: 'Platform (Lucide Icon)', type: 'icon' },
                                            { key: 'url', label: 'Profile Link', type: 'text' }
                                        ]}
                                    />
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.FAQ_SECTION && (
                                <div className="space-y-6">
                                    <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Section Image</Label>
                                            <div className="flex gap-2">
                                                <Input className="h-10 text-xs rounded-xl flex-1" placeholder="https://..." value={block.imageUrl || ''} onChange={(e: any) => setContent({ imageUrl: e.target.value })} />
                                                <Button
                                                    onClick={() => setActiveMediaField('imageUrl')}
                                                    variant="outline"
                                                    className="shrink-0 h-10 w-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all p-0 shadow-sm hover:scale-105 active:scale-95"
                                                >
                                                    <ImageIcon className="w-4 h-4 text-[#ff8602]" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Headings</Label>
                                            <Input className="h-10 text-xs rounded-xl font-bold bg-white" placeholder="Main Heading" value={block.heading || ''} onChange={(e: any) => setContent({ heading: e.target.value })} />
                                            <Input className="h-10 text-xs rounded-xl bg-white" placeholder="Highlighted Text" value={block.headingHighlight || ''} onChange={(e: any) => setContent({ headingHighlight: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accent Color</Label>
                                            <Input type="color" className="h-10 p-1 rounded-xl cursor-pointer" value={block.highlightColor || '#ff8602'} onChange={(e: any) => setContent({ highlightColor: e.target.value })} />
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
                                            <Input className="h-10 text-xs rounded-xl font-bold bg-white" placeholder="Main Title" value={block.title || ''} onChange={(e: any) => setContent({ title: e.target.value })} />
                                            <Input className="h-10 text-xs rounded-xl bg-white" placeholder="Subtitle" value={block.subtitle || ''} onChange={(e: any) => setContent({ subtitle: e.target.value })} />
                                        </div>
                                        <textarea className="w-full h-20 p-4 text-xs bg-white border border-slate-100 rounded-2xl resize-none outline-none shadow-sm" placeholder="Intro Description" value={block.description || ''} onChange={(e: any) => setContent({ description: e.target.value })} />
                                    </div>
                                    <ItemsListEditor
                                        items={block.items || []}
                                        onUpdate={(newItems) => setContent({ items: newItems })}
                                        fields={[
                                            { key: 'icon', label: 'Icon', type: 'icon' },
                                            { key: 'title', label: 'Label', type: 'text' },
                                            { key: 'subtitle', label: 'Subtext', type: 'text' }
                                        ]}
                                    />
                                </div>
                            )}

                            {block.type === BLOCK_TYPES.LOOP_GRID && (
                                <div className="space-y-6">
                                    <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Header Content</Label>
                                            <Input className="h-10 text-xs rounded-xl font-bold bg-white" placeholder="Main Title" value={block.heading || ''} onChange={(e: any) => setContent({ heading: e.target.value })} />
                                            <Input className="h-10 text-xs rounded-xl bg-white" placeholder="Highlighted Text" value={block.headingHighlight || ''} onChange={(e: any) => setContent({ headingHighlight: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accent Color</Label>
                                            <Input type="color" className="h-10 p-1 rounded-xl cursor-pointer" value={block.highlightColor || '#ff8602'} onChange={(e: any) => setContent({ highlightColor: e.target.value })} />
                                        </div>
                                        <textarea className="w-full h-20 p-4 text-xs bg-white border border-slate-100 rounded-2xl resize-none outline-none shadow-sm" placeholder="Intro Description" value={block.description || ''} onChange={(e: any) => setContent({ description: e.target.value })} />
                                    </div>
                                    <ItemsListEditor
                                        items={block.items || []}
                                        onUpdate={(newItems) => setContent({ items: newItems })}
                                        fields={[
                                            { key: 'image', label: 'Item Image', type: 'image' },
                                            { key: 'title', label: 'Item Title', type: 'text' }
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
                                    {/* Background Images - Only for Sections */}
                                    {[BLOCK_TYPES.COLUMNS, BLOCK_TYPES.FAQ_SECTION, BLOCK_TYPES.FEATURE_SECTION, BLOCK_TYPES.LOOP_GRID].includes(block.type) && (
                                        <div className="space-y-4 pt-2 border-t border-slate-50">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Background Images</Label>
                                                <Button
                                                    onClick={() => {
                                                        const currentImgs = s.backgroundImages || [];
                                                        setActiveItemIndex(currentImgs.length);
                                                    }}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-[9px] font-black uppercase tracking-widest text-[#ff8602] hover:text-[#ff8602] hover:bg-[#ff8602]/5 px-2"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Add Bg Image
                                                </Button>
                                            </div>
                                            <div className="space-y-3">
                                                {/* Support legacy single image if exists and no list yet */}
                                                {(!s.backgroundImages || s.backgroundImages.length === 0) && s.backgroundImage && (
                                                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                                                        <Input
                                                            className="h-10 text-xs rounded-xl flex-1"
                                                            value={s.backgroundImage}
                                                            readOnly
                                                        />
                                                        <Button
                                                            onClick={() => {
                                                                setStyles({
                                                                    backgroundImages: [s.backgroundImage],
                                                                    backgroundPositions: ['center center'],
                                                                    backgroundSizes: ['cover'],
                                                                    backgroundRepeats: ['no-repeat'],
                                                                    backgroundImage: ''
                                                                });
                                                            }}
                                                            variant="outline"
                                                            className="h-10 px-3 text-[10px] font-bold uppercase tracking-wider"
                                                        >
                                                            Convert to List
                                                        </Button>
                                                    </div>
                                                )}

                                                {(s.backgroundImages || []).map((img: string, idx: number) => (
                                                    <div key={idx} className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 relative group/bgitem">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[9px] font-bold text-slate-400">Image {idx + 1}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const newList = [...s.backgroundImages];
                                                                    const newPos = [...(s.backgroundPositions || [])];
                                                                    const newSizes = [...(s.backgroundSizes || [])];
                                                                    const newRepeats = [...(s.backgroundRepeats || [])];
                                                                    newList.splice(idx, 1);
                                                                    if (newPos[idx]) newPos.splice(idx, 1);
                                                                    if (newSizes[idx]) newSizes.splice(idx, 1);
                                                                    if (newRepeats[idx]) newRepeats.splice(idx, 1);
                                                                    setStyles({
                                                                        backgroundImages: newList,
                                                                        backgroundPositions: newPos,
                                                                        backgroundSizes: newSizes,
                                                                        backgroundRepeats: newRepeats
                                                                    });
                                                                }}
                                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 space-y-2">
                                                                <Input
                                                                    className="h-9 text-xs rounded-xl w-full bg-white border-slate-200"
                                                                    placeholder="https://..."
                                                                    value={img}
                                                                    onChange={(e: any) => {
                                                                        const newList = [...s.backgroundImages];
                                                                        newList[idx] = e.target.value;
                                                                        set('backgroundImages', newList);
                                                                    }}
                                                                />
                                                                <select
                                                                    className="h-8 text-[10px] font-bold w-full rounded-lg bg-white border border-slate-200 px-2 outline-none focus:ring-2 focus:ring-[#ff8602]/20"
                                                                    value={s.backgroundPositions?.[idx] || 'center center'}
                                                                    onChange={(e) => {
                                                                        const newPos = [...(s.backgroundPositions || [])];
                                                                        newPos[idx] = e.target.value;
                                                                        set('backgroundPositions', newPos);
                                                                    }}
                                                                >
                                                                    <option value="top left">Top Left</option>
                                                                    <option value="top center">Top Center</option>
                                                                    <option value="top right">Top Right</option>
                                                                    <option value="center left">Center Left</option>
                                                                    <option value="center center">Center Center</option>
                                                                    <option value="center right">Center Right</option>
                                                                    <option value="bottom left">Bottom Left</option>
                                                                    <option value="bottom center">Bottom Center</option>
                                                                    <option value="bottom right">Bottom Right</option>
                                                                </select>
                                                                <select
                                                                    className="h-8 text-[10px] font-bold w-full rounded-lg bg-white border border-slate-200 px-2 outline-none focus:ring-2 focus:ring-[#ff8602]/20"
                                                                    value={s.backgroundSizes?.[idx] || 'cover'}
                                                                    onChange={(e) => {
                                                                        const newSizes = [...(s.backgroundSizes || [])];
                                                                        newSizes[idx] = e.target.value;
                                                                        set('backgroundSizes', newSizes);
                                                                    }}
                                                                >
                                                                    <option value="cover">Cover (Auto Resize)</option>
                                                                    <option value="contain">Contain (Show All)</option>
                                                                    <option value="auto">Auto (Original)</option>
                                                                    <option value="100% 100%">Full (Stretch)</option>
                                                                </select>
                                                                <select
                                                                    className="h-8 text-[10px] font-bold w-full rounded-lg bg-white border border-slate-200 px-2 outline-none focus:ring-2 focus:ring-[#ff8602]/20"
                                                                    value={s.backgroundRepeats?.[idx] || 'no-repeat'}
                                                                    onChange={(e) => {
                                                                        const newRepeats = [...(s.backgroundRepeats || [])];
                                                                        newRepeats[idx] = e.target.value;
                                                                        set('backgroundRepeats', newRepeats);
                                                                    }}
                                                                >
                                                                    <option value="no-repeat">No Repeat</option>
                                                                    <option value="repeat">Repeat</option>
                                                                </select>
                                                            </div>
                                                            <Button
                                                                onClick={() => {
                                                                    setActiveItemIndex(idx);
                                                                    setIsMediaModalOpen(true);
                                                                }}
                                                                variant="outline"
                                                                className="shrink-0 h-9 w-9 bg-white border-slate-200 rounded-xl flex items-center justify-center p-0"
                                                            >
                                                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Corner Radius</Label>
                                        <div className="flex items-center gap-3">
                                            <input type="range" min={0} max={48} value={s.borderRadius ?? 0} onChange={(e: any) => set('borderRadius', Number(e.target.value))} className="flex-1 accent-[#ff8602]" />
                                            <Input type="number" value={s.borderRadius ?? 0} onChange={(e: any) => set('borderRadius', Number(e.target.value))} className="h-8 w-14 text-right text-xs font-mono font-bold" />
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-slate-100">
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
                                        <Input className="h-9 text-xs rounded-xl" placeholder="e.g. contact-section" value={block.customId || ''} onChange={(e: any) => setContent({ customId: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CSS Classes</Label>
                                        <Input className="h-9 text-xs rounded-xl" placeholder="e.g. custom-card shadow-lg" value={block.customClass || ''} onChange={(e: any) => setContent({ customClass: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parent Class</Label>
                                        <Input className="h-9 text-xs rounded-xl" placeholder="e.g. wrapper-dark" value={block.parentClass || ''} onChange={(e: any) => setContent({ parentClass: e.target.value })} />
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
                                            <Button
                                                onClick={() => setIsMediaModalOpen(true)}
                                                variant="outline"
                                                className="shrink-0 h-10 w-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors p-0"
                                            >
                                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    </div>
                                    <MediaLibraryModal
                                        open={isMediaModalOpen}
                                        onOpenChange={setIsMediaModalOpen}
                                        onSelect={(url) => set('backgroundImage', url)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <MediaLibraryModal
                open={isMediaModalOpen}
                onOpenChange={setIsMediaModalOpen}
                onSelect={(url) => {
                    if (activeItemIndex !== null) {
                        const newList = [...(s.backgroundImages || [])];
                        // If it's the last index + 1, it means we are adding a new one
                        if (activeItemIndex >= newList.length) {
                            const newPos = [...(s.backgroundPositions || []), 'center center'];
                            const newSizes = [...(s.backgroundSizes || []), 'cover'];
                            const newRepeats = [...(s.backgroundRepeats || []), 'no-repeat'];
                            setStyles({
                                backgroundImages: [...newList, url],
                                backgroundPositions: newPos,
                                backgroundSizes: newSizes,
                                backgroundRepeats: newRepeats
                            });
                        } else {
                            newList[activeItemIndex] = url;
                            set('backgroundImages', newList);
                        }
                    } else if (activeMediaField === 'backgroundImage') {
                        set('backgroundImage', url);
                    } else if (activeMediaField) {
                        setContent({ [activeMediaField]: url });
                    }
                    setActiveMediaField(null);
                    setActiveItemIndex(null);
                }}
            />
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

    const canvasWidth = viewMode === 'mobile' ? 375 : viewMode === 'tablet' ? 600 : 1200;

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
        { type: BLOCK_TYPES.LOOP_GRID, icon: LayoutTemplate, label: 'Loop Grid' },
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
        <div className="flex flex-col border rounded-lg overflow-hidden h-full">
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

            <div className="flex flex-1 overflow-hidden">
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