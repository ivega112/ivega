"use client";

import { useMemo, useState } from "react";
import type { Receiver, Attachment, AttachmentType } from "@prisma/client";
import { Button } from "@/software-components/ui/button";
import { Input } from "@/software-components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/software-components/ui/table";
import { Badge } from "@/software-components/ui/badge";
import { Plus, Trash2, Edit, FileDown, CheckCircle, XCircle, SatelliteDish } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/software-components/ui/sheet";
import { Label } from "@/software-components/ui/label";
import { toast } from "sonner";
import {
  createReceiver,
  updateReceiver,
  deleteReceiver,
  addAttachment,
  deleteAttachment,
  getUploadUrl,
  togglePublish,
} from "./actions";
import { validateImageFile, validateAttachmentFile } from "@/software-lib/uploads";
import { getSupabaseBrowserClient, STORAGE_BUCKET } from "@/software-lib/supabase-browser";

type ReceiverWithAttachments = Receiver & { attachments: Attachment[] };

async function uploadToStorage(file: File, folder: "images" | "attachments") {
  const supabaseClient = getSupabaseBrowserClient();
  const { path } = await getUploadUrl(folder, file.name);
  
  const { error } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true });

  if (error) {
    console.error("Upload error occurred.");
    throw new Error(`تعذر رفع الملف: ${error.message} (قد يكون بسبب ضعف الاتصال أو حظر من الشبكة)`);
  }

  const {
    data: { publicUrl },
  } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { path, publicUrl };
}

export default function ReceiversClient({ initialReceivers }: { initialReceivers: ReceiverWithAttachments[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingReceiver, setEditingReceiver] = useState<ReceiverWithAttachments | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return initialReceivers;
    return initialReceivers.filter(
      (r) => r.name.toLowerCase().includes(q) || r.modelNumber.toLowerCase().includes(q)
    );
  }, [initialReceivers, searchTerm]);

  function openCreateSheet() {
    setEditingReceiver(null);
    setExistingAttachments([]);
    setIsSheetOpen(true);
  }

  function openEditSheet(receiver: ReceiverWithAttachments) {
    setEditingReceiver(receiver);
    setExistingAttachments(receiver.attachments);
    setIsSheetOpen(true);
  }

  async function handleDeleteExistingAttachment(id: string) {
    if (!confirm("هل تريد حذف هذا الملف؟")) return;
    setExistingAttachments((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteAttachment(id);
      toast.success("تم حذف الملف");
    } catch {
      toast.error("فشل حذف الملف");
    }
  }

  async function uploadAndAttach(receiverId: string, files: File[], type: AttachmentType) {
    for (const file of files) {
      if (file.size === 0) continue;
      const error = validateAttachmentFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }
      try {
        const { path } = await uploadToStorage(file, "attachments");
        await addAttachment(receiverId, file.name, type, path, file.name, file.type, file.size);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `فشل رفع ${file.name}`);
      }
    }
  }

  async function handleSaveReceiver(formData: FormData) {
    try {
      setIsSaving(true);

      const imageFile = formData.get("imageFile") as File;
      if (imageFile && imageFile.size > 0) {
        const error = validateImageFile(imageFile);
        if (error) throw new Error(error);
        const { path, publicUrl } = await uploadToStorage(imageFile, "images");
        formData.set("imageUrl", publicUrl);
        formData.set("imageKey", path);
      }

      const softwareFiles = (formData.getAll("softwareFiles") as File[]).filter((f) => f.size > 0);
      const romFiles = (formData.getAll("romFiles") as File[]).filter((f) => f.size > 0);

      // Prevent 500 / 413 Payload Too Large by removing the massive files from the Server Action payload.
      // These are uploaded directly to Supabase via signed URLs below, so the server doesn't need them.
      formData.delete("softwareFiles");
      formData.delete("romFiles");
      formData.delete("imageFile");

      let receiverId = editingReceiver?.id;
      if (receiverId) {
        await updateReceiver(receiverId, formData);
      } else {
        const created = await createReceiver(formData);
        receiverId = created.id;
      }

      await uploadAndAttach(receiverId, softwareFiles, "SOFTWARE");
      await uploadAndAttach(receiverId, romFiles, "ROM");

      toast.success(editingReceiver ? "تم تحديث الجهاز بنجاح" : "تم إضافة الجهاز بنجاح");
      setIsSheetOpen(false);
      setEditingReceiver(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الجهاز؟ سيتم حذف جميع ملفاته المرفقة نهائياً.")) return;
    try {
      await deleteReceiver(id);
      toast.success("تم الحذف بنجاح");
    } catch {
      toast.error("فشل الحذف");
    }
  }

  async function handleTogglePublish(id: string, next: boolean) {
    try {
      await togglePublish(id, next);
      toast.success(next ? "تم نشر الجهاز" : "تم إخفاء الجهاز");
    } catch {
      toast.error("فشلت العملية");
    }
  }

  const softwareAttachments = existingAttachments.filter((a) => a.type === "SOFTWARE");
  const romAttachments = existingAttachments.filter((a) => a.type === "ROM");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border">
        <Input
          placeholder="بحث عن جهاز..."
          className="sm:w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) setEditingReceiver(null); }}>
          <Button onClick={openCreateSheet}>
            <Plus className="w-4 h-4" />
            إضافة جهاز جديد
          </Button>
          <SheetContent className="overflow-y-auto w-full sm:max-w-xl" side="right">
            <SheetHeader>
              <SheetTitle className="text-xl">{editingReceiver ? "تعديل الجهاز" : "إضافة جهاز جديد"}</SheetTitle>
            </SheetHeader>
            <form key={editingReceiver?.id ?? "new"} action={handleSaveReceiver} className="space-y-6 p-4 pt-0">
              {editingReceiver && <input type="hidden" name="id" value={editingReceiver.id} />}

              <div className="space-y-2">
                <Label>اسم الجهاز</Label>
                <Input name="name" required defaultValue={editingReceiver?.name || ""} placeholder="مثال: iVega Hyper K800" />
              </div>
              <div className="space-y-2">
                <Label>رقم الموديل</Label>
                <Input name="modelNumber" required defaultValue={editingReceiver?.modelNumber || ""} />
              </div>
              <div className="space-y-2">
                <Label>وصف مختصر (اختياري)</Label>
                <textarea
                  name="shortDescription"
                  rows={3}
                  defaultValue={editingReceiver?.shortDescription || ""}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  صورة الجهاز {editingReceiver?.imageUrl && "(اتركه فارغاً للحفاظ على الصورة الحالية)"}
                </Label>
                {editingReceiver?.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editingReceiver.imageUrl} alt={editingReceiver.name} className="w-24 h-24 object-contain rounded-md border border-border bg-secondary" />
                )}
                <Input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" />
                <p className="text-xs text-muted-foreground">JPG, PNG أو WEBP، حتى 5 ميجابايت.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPublished"
                  value="true"
                  id="isPublished"
                  defaultChecked={editingReceiver ? editingReceiver.isPublished : true}
                  className="rounded border-input"
                />
                <Label htmlFor="isPublished">منشور ومتاح للزوار</Label>
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <Label className="text-sm font-semibold">ملفات Software</Label>
                {softwareAttachments.length > 0 && (
                  <div className="space-y-2">
                    {softwareAttachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/40">
                        <p className="text-sm truncate">{att.name}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive shrink-0"
                          onClick={() => handleDeleteExistingAttachment(att.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Input name="softwareFiles" type="file" multiple />
                <p className="text-xs text-muted-foreground">bin, rom, img, abs, zip, rar, 7z — حتى 50 ميجابايت لكل ملف.</p>
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <Label className="text-sm font-semibold">ملفات ROM</Label>
                {romAttachments.length > 0 && (
                  <div className="space-y-2">
                    {romAttachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/40">
                        <p className="text-sm truncate">{att.name}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive shrink-0"
                          onClick={() => handleDeleteExistingAttachment(att.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Input name="romFiles" type="file" multiple />
                <p className="text-xs text-muted-foreground">bin, rom, img, abs, zip, rar, 7z — حتى 50 ميجابايت لكل ملف.</p>
              </div>

              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? "جاري الحفظ..." : "حفظ الجهاز"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الجهاز</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">المرفقات</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.imageUrl} alt={r.name} className="w-10 h-10 rounded-md object-contain border border-border bg-secondary" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-secondary border border-border flex items-center justify-center">
                        <SatelliteDish className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p>{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.modelNumber}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <button onClick={() => handleTogglePublish(r.id, !r.isPublished)} className="inline-block">
                    {r.isPublished ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                        <CheckCircle className="w-3 h-3" /> منشور
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="w-3 h-3" /> مخفي
                      </Badge>
                    )}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileDown className="w-4 h-4 ml-1" />
                    {r.attachments.length} ملفات
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditSheet(r)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  لا توجد أجهزة مطابقة.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
