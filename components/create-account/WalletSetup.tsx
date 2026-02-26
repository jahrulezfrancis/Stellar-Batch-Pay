"use client";

import { Wallet, Info, ChevronDown } from "lucide-react";

interface WalletSetupProps {
  network: string;
  onNetworkChange: (value: string) => void;
  onConnectWallet: () => void;
  walletConnected: boolean;
}

export default function WalletSetup({
  network,
  onNetworkChange,
  onConnectWallet,
  walletConnected,
}: WalletSetupProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-white">Wallet Setup</h3>
      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={onConnectWallet}
          className={`
            flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all duration-200
            ${
              walletConnected
                ? "bg-[#00D98B] border border-[#00D98B] text-white"
                : "bg-[##00D98B] hover:bg-[##00D98B] text-white"
            }
          `}
        >
          <Wallet size={16} />
          {walletConnected ? "Wallet Connected" : "Connect Wallet"}
        </button>

        <div className="relative">
          <select
            value={network}
            onChange={(e) => onNetworkChange(e.target.value)}
            className="appearance-none bg-[#1a2235] border border-gray-700 rounded-lg px-4 py-3 pr-10 text-white text-sm
              focus:outline-none focus:border-[#00d4a0] focus:ring-1 focus:ring-[#00d4a0]/30
              hover:border-gray-500 transition-all duration-200 cursor-pointer"
          >
            <option value="testnet">Testnet</option>
            <option value="mainnet">Mainnet</option>
            <option value="futurenet">Futurenet</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      <div className="flex items-start gap-2 bg-[#1a2235]/60 border border-gray-700/50 rounded-lg px-3 py-2.5">
        <Info size={14} className="text-[#00d4a0] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-400 leading-relaxed">
          Wallet connection allows transaction signing and payment execution.
          Your private keys remain secure.
        </p>
      </div>
    </div>
  );
}