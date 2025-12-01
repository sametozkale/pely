
import React from 'react';
import { 
  Folder, 
  Hash, 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Trash2, 
  Edit2, 
  Sparkles, 
  ExternalLink, 
  Menu, 
  ChevronRight, 
  MoreHorizontal,
  X,
  Check,
  PanelLeft,
  Archive,
  RotateCcw,
  Copy
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { cn } from '../lib/utils';

// --- Animated Icon Wrapper ---
// Mimics lucide-animated behavior using Framer Motion
interface AnimatedIconProps {
  icon: React.ElementType;
  className?: string;
  animation?: 'scale' | 'rotate' | 'shake' | 'bounce';
}

const iconVariants: Record<string, Variants> = {
  scale: {
    rest: { scale: 1 },
    hover: { scale: 1.1, transition: { type: "spring", stiffness: 400, damping: 10 } }
  },
  rotate: {
    rest: { rotate: 0 },
    hover: { rotate: 90, transition: { type: "spring", stiffness: 200, damping: 10 } }
  },
  shake: {
    rest: { rotate: 0 },
    hover: { 
      rotate: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 } 
    }
  },
  bounce: {
    rest: { y: 0 },
    hover: { 
      y: -3,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    }
  }
};

const AnimatedIcon: React.FC<AnimatedIconProps> = ({ icon: Icon, className, animation = 'scale' }) => {
  return (
    <motion.div
      variants={iconVariants[animation]}
      initial="rest"
      whileHover="hover"
      whileTap="rest"
      className={cn("inline-flex items-center justify-center", className)}
    >
      <Icon className="w-full h-full" />
    </motion.div>
  );
};

// --- Exported Icons ---

export const IconFolder = ({ className }: { className?: string }) => (
  <Folder className={className} strokeWidth={1.5} />
);

export const IconHash = ({ className }: { className?: string }) => (
  <Hash className={className} strokeWidth={1.5} />
);

export const IconPlus = ({ className }: { className?: string }) => (
  <AnimatedIcon icon={Plus} className={className} animation="rotate" />
);

export const IconSearch = ({ className }: { className?: string }) => (
  <Search className={className} strokeWidth={1.5} />
);

export const IconGrid = ({ className }: { className?: string }) => (
  <LayoutGrid className={className} strokeWidth={1.5} />
);

export const IconList = ({ className }: { className?: string }) => (
  <List className={className} strokeWidth={1.5} />
);

export const IconTrash = ({ className }: { className?: string }) => (
  <AnimatedIcon icon={Trash2} className={className} animation="shake" />
);

export const IconEdit = ({ className }: { className?: string }) => (
  <AnimatedIcon icon={Edit2} className={className} animation="scale" />
);

export const IconSparkles = ({ className }: { className?: string }) => (
  <AnimatedIcon icon={Sparkles} className={className} animation="bounce" />
);

export const IconExternalLink = ({ className }: { className?: string }) => (
  <AnimatedIcon icon={ExternalLink} className={className} animation="scale" />
);

export const IconMenu = ({ className }: { className?: string }) => (
  <Menu className={className} strokeWidth={1.5} />
);

export const IconSidebar = ({ className }: { className?: string }) => (
  <PanelLeft className={className} strokeWidth={1.5} />
);

export const IconChevronRight = ({ className }: { className?: string }) => (
  <ChevronRight className={className} strokeWidth={1.5} />
);

export const IconMoreHorizontal = ({ className }: { className?: string }) => (
  <MoreHorizontal className={className} strokeWidth={1.5} />
);

export const IconX = ({ className }: { className?: string }) => (
  <AnimatedIcon icon={X} className={className} animation="rotate" />
);

export const IconCheck = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
  <Check className={className} strokeWidth={strokeWidth} />
);

export const IconArchive = ({ className }: { className?: string }) => (
  <AnimatedIcon icon={Archive} className={className} animation="scale" />
);

export const IconUndo = ({ className }: { className?: string }) => (
  <AnimatedIcon icon={RotateCcw} className={className} animation="rotate" />
);

export const IconCopy = ({ className }: { className?: string }) => (
  <AnimatedIcon icon={Copy} className={className} animation="scale" />
);
