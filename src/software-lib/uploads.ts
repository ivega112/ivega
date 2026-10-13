export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_FILE_EXTENSIONS = [
  "bin", "rom", "img", "abs", "zip", "rar", "7z", "ssu", "fw", "tar", "gz", "bz2", "iso"
] as const;

// 5GB limit for large firmware files
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; 

const BLOCKED_EXTENSIONS = ["exe", "msi", "bat", "cmd", "ps1", "sh", "php", "php5", "phtml", "js", "html", "htm", "svg", "py", "pl", "rb", "cgi"];

function getExtension(fileName: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  return match ? match?.[1]?.toLowerCase() || "" : "";
}

export function validateImageFile(file: { name: string; type: string; size: number }): string | null {
  const ext = getExtension(file.name);
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])) {
    return "امتداد الصورة غير مسموح به. الأنواع المسموحة: JPG, PNG, WEBP";
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return "نوع ملف الصورة غير صالح";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "حجم الصورة يتجاوز الحد المسموح (5 ميجابايت)";
  }
  return null;
}

export function validateAttachmentFile(file: { name: string; size: number }): string | null {
  const ext = getExtension(file.name);
  
  // حماية صارمة لمنع الملفات التنفيذية وملفات الويب الخبيثة (Web Shells & XSS)
  if (BLOCKED_EXTENSIONS.includes(ext) || !ext) {
    return "نوع هذا الملف غير مسموح به لأسباب أمنية";
  }
  
  // السماح برفع أي ملف طالما أنه ليس في القائمة السوداء أعلاه
  // هذا يلبي متطلبات رفع ملفات السوفتوير الغريبة مع الحفاظ على الأمان الأساسي
  
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "حجم الملف يتجاوز الحد المسموح (5 جيجابايت)";
  }
  
  return null;
}
