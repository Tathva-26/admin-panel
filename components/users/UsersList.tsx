"use client";

import { useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable, { type Column } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import { RoleBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { useList } from "@/hooks/useList";
import { useMutation } from "@/hooks/useMutation";
import { listUsers, updateUserRole } from "@/lib/api/users";
import { formatDate } from "@/lib/format";
import { asEnum, asText } from "@/lib/params";
import { ROLES, type AdminUser, type Role } from "@/types";

/** The role a user would be moved to — this panel only ever toggles. */
const opposite = (role: Role): Role => (role === "ADMIN" ? "USER" : "ADMIN");

export default function UsersList() {
  const users = useList<AdminUser>(({ page, pageSize, filters }) =>
    listUsers({
      page,
      pageSize,
      search: asText(filters.search),
      role: asEnum(filters.role, ROLES),
      sort: asText(filters.sort),
      order: filters.order === "desc" ? "desc" : undefined,
    }),
  );

  const [pending, setPending] = useState<AdminUser | null>(null);
  const changeRole = useMutation((id: number, role: Role) =>
    updateUserRole(id, { role }),
  );

  async function confirmRoleChange() {
    if (!pending) return;

    const updated = await changeRole.run(pending.id, opposite(pending.role));
    // Left open on failure: the backend refuses to demote the last admin, and
    // that message is the whole point of asking.
    if (updated) {
      setPending(null);
      users.refetch();
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      key: "id",
      header: "ID",
      className: "numeric w-16 text-zinc-400",
      hideOnMobile: true,
      cell: (user) => user.id,
    },
    {
      key: "user",
      sortKey: "name",
      header: "User",
      primary: true,
      cell: (user) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900">{user.name}</p>
          <p className="truncate text-xs text-zinc-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "numeric w-32 text-zinc-600",
      cell: (user) => user.phone || "—",
    },
    {
      key: "college",
      header: "College",
      className: "text-zinc-600",
      hideOnMobile: true,
      cell: (user) => user.college || "—",
    },
    {
      key: "district",
      header: "District",
      className: "w-32 text-zinc-600",
      hideOnMobile: true,
      cell: (user) => user.district || "—",
    },
    {
      key: "referral",
      header: "Referral",
      className: "numeric w-28 text-zinc-500",
      cell: (user) => user.referral,
    },
    {
      key: "role",
      header: "Role",
      className: "w-24",
      cell: (user) => <RoleBadge role={user.role} />,
    },
    {
      key: "createdAt",
      sortKey: "createdAt",
      header: "Joined",
      className: "numeric w-32 text-zinc-500",
      hideOnMobile: true,
      cell: (user) => formatDate(user.createdAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      isActions: true,
      cell: (user) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              changeRole.reset();
              setPending(user);
            }}
          >
            {user.role === "ADMIN" ? "Remove admin" : "Make admin"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={users.filters.search ?? ""}
          onChange={(value) => users.setFilter("search", value)}
          placeholder="Search name or email…"
        />

        <Select
          aria-label="Filter by role"
          className="h-9 w-full sm:h-8 sm:w-36"
          value={users.filters.role ?? ""}
          onChange={(e) => users.setFilter("role", e.target.value)}
        >
          <option value="">All roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={users.items}
        rowKey={(user) => user.id}
        loading={users.loading}
        error={users.error}
        onRetry={users.refetch}
        sort={users.sort}
        order={users.order}
        onToggleSort={users.toggleSort}
        emptyTitle="No users match"
        emptyDescription="Try clearing the search or role filter."
        footer={
          <Pagination
            page={users.page}
            pageSize={users.pageSize}
            total={users.total}
            totalPages={users.totalPages}
            onPageChange={users.setPage}
          />
        }
      />

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.role === "ADMIN"
            ? `Remove admin access from ${pending?.name}?`
            : `Make ${pending?.name} an admin?`
        }
        description={
          pending?.role === "ADMIN"
            ? "They will lose access to this panel immediately."
            : "They will get full access to this panel, including changing other people's roles."
        }
        confirmLabel={pending?.role === "ADMIN" ? "Remove admin" : "Make admin"}
        destructive={pending?.role === "ADMIN"}
        loading={changeRole.loading}
        error={changeRole.error}
        onConfirm={confirmRoleChange}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
