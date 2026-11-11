"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, ArrowUpRight, ShieldCheck } from "lucide-react";

interface SaleItem {
  id: string;
  storeName: string;
  productTitle: string;
  amount: number;
  buyerCity: string;
  buyerState: string;
  timeAgo: string;
}

export default function LiveSalesFeed() {
  const [sales, setSales] = useState<SaleItem[]>([
    {
      id: "ord_9901",
      storeName: "Bizi Bees Boutique",
      productTitle: "Blind Date with a Book Mystery Box",
      amount: 24.0,
      buyerCity: "Salt Lake City",
      buyerState: "UT",
      timeAgo: "2m ago",
    },
    {
      id: "ord_9902",
      storeName: "Luma Clinical™",
      productTitle: "LumaGlow™ QuadWave Pro 4-in-1",
      amount: 44.99,
      buyerCity: "Austin",
      buyerState: "TX",
      timeAgo: "4m ago",
    },
    {
      id: "ord_9903",
      storeName: "Fizz Lab™ Soda Co.",
      productTitle: "At-Home Dirty Soda Starter Kit",
      amount: 48.0,
      buyerCity: "Provo",
      buyerState: "UT",
      timeAgo: "7m ago",
    },
    {
      id: "ord_9904",
      storeName: "Luma Clinical™",
      productTitle: "LumaRelief™ Cold Compression Mask",
      amount: 29.99,
      buyerCity: "Denver",
      buyerState: "CO",
      timeAgo: "11m ago",
    },
  ]);

  // Simulate subtle live streaming order pulses
  useEffect(() => {
    const streamInterval = setInterval(() => {
      const candidates: SaleItem[] = [
        {
          id: `ord_${Math.floor(1000 + Math.random() * 9000)}`,
          storeName: "Bizi Bees Boutique",
          productTitle: "Vintage Hardcover Edition Bundle",
          amount: 32.5,
          buyerCity: "Orem",
          buyerState: "UT",
          timeAgo: "Just now",
        },
        {
          id: `ord_${Math.floor(1000 + Math.random() * 9000)}`,
          storeName: "Luma Clinical™",
          productTitle: "Activating Conduction Gel 50ml Duo",
          amount: 28.0,
          buyerCity: "Scottsdale",
          buyerState: "AZ",
          timeAgo: "Just now",
        },
        {
          id: `ord_${Math.floor(1000 + Math.random() * 9000)}`,
          storeName: "Fizz Lab™ Soda Co.",
          productTitle: "Coconut Cream Dirty Soda Syrup Duo",
          amount: 22.0,
          buyerCity: "St. George",
          buyerState: "UT",
          timeAgo: "Just now",
        },
      ];

      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      setSales((prev) => [chosen, ...prev.slice(0, 5)]);
    }, 18000);

    return () => clearInterval(streamInterval);
  }, []);

  return (
    <div className="rounded-xl border border-titanium-800 bg-titanium-900/60 p-4 shadow-lg backdrop-blur flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-titanium-800">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="h-4 w-4 text-cyber-cyan" />
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-titanium-200">
            Live Fleet Sales Stream
          </h3>
        </div>
        <span className="flex items-center space-x-1 text-[10px] font-mono text-cyber-emerald">
          <span className="h-1.5 w-1.5 rounded-full bg-cyber-emerald animate-ping"></span>
          <span>POLLING ACTIVE</span>
        </span>
      </div>

      <div className="divide-y divide-titanium-800/60 overflow-y-auto mt-2 space-y-1 flex-1">
        {sales.map((item) => (
          <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-white truncate max-w-[180px]">{item.productTitle}</span>
                <span className="text-[10px] font-mono text-titanium-400">
                  ({item.buyerCity}, {item.buyerState})
                </span>
              </div>
              <div className="text-[11px] text-titanium-400 font-mono flex items-center space-x-2">
                <span className="text-titanium-300 font-medium">{item.storeName}</span>
                <span>•</span>
                <span>{item.timeAgo}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-cyber-emerald text-sm">
                +${item.amount.toFixed(2)}
              </span>
              <span className="block text-[10px] text-titanium-400 font-mono">100% Dropship</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
