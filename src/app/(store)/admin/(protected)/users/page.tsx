import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { CreateUserForm } from "./create-user-form";
import { UserRow } from "./user-row";

export default async function AdminUsersPage() {
  const currentUser = await requirePermission("users:manage");

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">المستخدمون</h1>
      <p className="text-xs text-text-faint">جميع مستخدمي لوحة الإدارة يملكون صلاحية مدير عام.</p>

      <div className="overflow-x-auto rounded-card border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel text-xs text-text-muted">
            <tr>
              <th className="p-3 text-start">المستخدم</th>
              <th className="p-3 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUser.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      <CreateUserForm />
    </div>
  );
}
