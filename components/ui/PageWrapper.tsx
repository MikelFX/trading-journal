"use client";

import { motion } from "framer-motion";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export function BlurReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, filter: "blur(12px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerChildren({
  children,
  staggerDelay = 0.08,
  className,
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function FloatCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

export function GlowOnHover({
  children,
  color = "accent",
  className,
}: {
  children: React.ReactNode;
  color?: "accent" | "profit" | "loss";
  className?: string;
}) {
  const glowColors = {
    accent: "rgba(0,200,255,0.2)",
    profit: "rgba(0,229,160,0.2)",
    loss: "rgba(255,77,109,0.2)",
  };

  return (
    <motion.div
      className={className}
      whileHover={{
        boxShadow: `0 0 40px ${glowColors[color]}, 0 8px 32px rgba(0,0,0,0.4)`,
        y: -3,
        transition: { duration: 0.2 },
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
