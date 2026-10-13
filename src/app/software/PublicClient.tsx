"use client";

import { useState, useMemo, useEffect } from "react";
import type { Receiver, Attachment, AttachmentType } from "@prisma/client";
import { Input } from "@/software-components/ui/input";
import { Card, CardContent } from "@/software-components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/software-components/ui/dialog";
import { Search, X, SatelliteDish, Download } from "lucide-react";
import { Button } from "@/software-components/ui/button";
import { Skeleton } from "@/software-components/ui/skeleton";

type ReceiverWithAttachments = Receiver & { attachments: Attachment[] };

export default function PublicClient({ receivers, isAdmin = false }: { receivers: ReceiverWithAttachments[]; isAdmin?: boolean }) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceiver, setSelectedReceiver] = useState<ReceiverWithAttachments | null>(null);
  const isSearching = searchInput !== searchQuery;

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filteredReceivers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return receivers;
    return receivers.filter((r) => r.name.toLowerCase().includes(q) || r.modelNumber.toLowerCase().includes(q));
  }, [receivers, searchQuery]);

  return (
    <div id="search" className="container mx-auto px-4 pb-20">
      <div className="max-w-xl mx-auto mb-10">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الموديل..."
            className="w-full h-12 pr-11 pl-11 text-base rounded-xl"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="مسح البحث"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl bg-card border border-border overflow-hidden">
              <Skeleton className="w-full aspect-video" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredReceivers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredReceivers.map((receiver) => (
            <Card
              key={receiver.id}
              className="cursor-pointer hover:shadow-md transition-shadow py-0"
              onClick={() => setSelectedReceiver(receiver)}
            >
              <div className="aspect-video bg-secondary relative overflow-hidden">
                {receiver.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={receiver.imageUrl}
                    alt={`جهاز ${receiver.name}`}
                    className="w-full h-full object-contain p-3"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <SatelliteDish className="w-10 h-10 opacity-40" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground line-clamp-1">{receiver.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{receiver.modelNumber}</p>
                {receiver.shortDescription && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{receiver.shortDescription}</p>
                )}
                <Button variant="secondary" size="sm" className="w-full mt-3">
                  عرض الملفات
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-xl border border-border max-w-xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">لم يتم العثور على نتائج</h3>
          <p className="text-muted-foreground mb-6">لم نعثر على أي جهاز يطابق بحثك الحالي.</p>
          <Button variant="outline" onClick={() => setSearchInput("")}>
            مسح البحث
          </Button>
        </div>
      )}

      <Dialog open={!!selectedReceiver} onOpenChange={(open) => !open && setSelectedReceiver(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden w-[95vw] sm:w-full">
          {selectedReceiver && (
            <>
              <div className="aspect-video bg-secondary relative">
                {selectedReceiver.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedReceiver.imageUrl}
                    alt={`جهاز ${selectedReceiver.name}`}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <SatelliteDish className="w-14 h-14 text-muted-foreground opacity-40" />
                  </div>
                )}
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh] space-y-6">
                <DialogHeader className="text-right">
                  <DialogTitle className="text-xl">{selectedReceiver.name}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground -mt-4">{selectedReceiver.modelNumber}</p>

                {selectedReceiver.shortDescription && (
                  <p className="text-sm text-foreground leading-relaxed">{selectedReceiver.shortDescription}</p>
                )}

                {selectedReceiver.attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6 bg-secondary/40 rounded-lg border border-border">
                    لا توجد ملفات متاحة حالياً.
                  </p>
                ) : (
                  <AttachmentTabs key={selectedReceiver.id} attachments={selectedReceiver.attachments} isAdmin={isAdmin} />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttachmentTabs({ attachments, isAdmin = false }: { attachments: Attachment[]; isAdmin?: boolean }) {
  const software = attachments.filter((a) => a.type === "SOFTWARE");
  const rom = attachments.filter((a) => a.type === "ROM");
  const [activeType, setActiveType] = useState<AttachmentType>(software.length > 0 ? "SOFTWARE" : "ROM");
  const items = activeType === "SOFTWARE" ? software : rom;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {software.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveType("SOFTWARE")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeType === "SOFTWARE"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Software
          </button>
        )}
        {rom.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveType("ROM")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeType === "ROM"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            ROM
          </button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((att) => (
          <div
            key={att.id}
            className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-secondary/40"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{att.name}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {att.size ? <span>{(att.size / 1024 / 1024).toFixed(2)} MB</span> : null}
                {isAdmin && <span>{att.downloadCount.toLocaleString("ar")} تنزيل</span>}
              </div>
            </div>
            <a href={`/software/api/download/${att.id}`}>
              <Button size="sm">
                <Download className="w-4 h-4" />
                تحميل
              </Button>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
