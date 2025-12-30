"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "../lib/framer-motion";
import { pageTransition, pageVariants } from "../lib/animations";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
