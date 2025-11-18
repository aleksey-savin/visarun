import {Button} from "@/components/ui/button";
import {Check, Copy, Download} from "lucide-react";
import React from "react";

const BankingDetailsButton = ({
  copiedText,
  bankingDetailsContent,
  bankingDetailsUrl,
  handleCopyToClipboard,
  handleDownloadBankingDetailsFile,
} : {
  copiedText: string | undefined;
  bankingDetailsContent: string | undefined;
  bankingDetailsUrl: string | undefined;
  handleCopyToClipboard: (event: React.MouseEvent, text: string) => void;
  handleDownloadBankingDetailsFile: (url: string) => void;
}) => {
  return (
    <Button
      className={`${
        copiedText === bankingDetailsContent && bankingDetailsContent
          ? 'bg-green-500/20 text-green-300'
          : 'bg-muted hover:bg-muted/80'
      } w-full overflow-hidden hover:bg-gray-500`}
      onClick={e => {
        if (bankingDetailsContent)
          handleCopyToClipboard(e, bankingDetailsContent);
        else if (bankingDetailsUrl)
          handleDownloadBankingDetailsFile(bankingDetailsUrl);
      }}
      variant="secondary"
    >
      {bankingDetailsContent ? (
        <>
          {copiedText === bankingDetailsContent ? (
            <Check className="w-3 h-3 ml-1 animate-pulse" />
          ) : (
            <Copy className="w-3 h-3 ml-1" />
          )}
          <span className="block truncate text-ellipsis">
            {bankingDetailsContent}
          </span>
        </>
      ) : (
        <div className="flex gap-1">
          <Download />
          <span className="block truncate text-ellipsis">
            Download Banking Details File
          </span>
        </div>
      )}
    </Button>
  )
}

export default BankingDetailsButton;