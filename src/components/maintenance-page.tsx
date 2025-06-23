"use client";

import { motion } from "framer-motion";
import { Clock, Wrench } from "lucide-react";

export default function MaintenancePage({
    startedAt,
}: {
    startedAt: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          className="text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Icon */}
          <motion.div
            className="flex justify-center"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <div className="bg-orange-100 p-6 rounded-full">
              <Wrench className="w-12 h-12 text-orange-500" />
            </div>
          </motion.div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-800">
              Under Maintenance
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              We&apos;re making some improvements to serve you better.
              <br />
              We&apos;ll be back in a few minutes.
            </p>
          </div>

          {/* Time indicator */}
          <motion.div
            className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex items-center justify-center space-x-2 text-slate-700">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Will be back in in a few minutes (Started {startedAt})
              </span>
            </div>
          </motion.div>

          {/* Loading dots */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-orange-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
