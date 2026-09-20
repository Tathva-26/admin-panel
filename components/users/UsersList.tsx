"use client";

import { useMemo, useState } from "react";

import Avatar from "@/components/common/Avatar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable, { type Column } from "@/components/common/DataTable";
import DistributionBar, { type Segment } from "@/components/common/DistributionBar";
import SearchInput from "@/components/common/SearchInput";
import { RoleBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { useCsvExport, type CsvCell } from "@/hooks/useCsvExport";
import { useList } from "@/hooks/useList";
import { useMutation } from "@/hooks/useMutation";
import { listUsers, updateUserRole } from "@/lib/api/users";
import { apiErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import { roleLabel } from "@/lib/labels";
import { asEnum, asText } from "@/lib/params";
import { ORDERS, ROLES, type AdminUser, type Role } from "@/types";

const EXPORT_HEADERS = [
  "ID",
  "Name",
  "Email",
  "Phone",
  "College",
  "District",
  "State",
  "Branch",
  "Semester",
  "Year",
  "Referral code",
  "Role",
  "Joined",
];

const toExportRow = (user: AdminUser): CsvCell[] => [
  user.id,
  user.name,
  user.email,
  // Kept as text: a leading zero on a phone number must survive the spreadsheet.
  user.phone ?? "",
  user.college ?? "",
  user.district ?? "",
  user.state ?? "",
  user.branch ?? "",
  user.semester ?? "",
  user.year ?? "",
  // Null for everyone but a CA with a complete profile — TIQR issues it.
  user.referralCode ?? "",
  user.role,
  formatDate(user.createdAt),
];

export default function UsersList() {
  const users = useList<AdminUser>(({ page, pageSize, filters }) =>
    listUsers({
      page,
      pageSize,
      search: asText(filters.search),
      role: asEnum(filters.role, ROLES),
      sort: asText(filters.sort),
      order: asEnum(filters.order, ORDERS),
    }),
  );

  // Same filters as the table, so the export matches what is on screen rather
  // than dumping the entire user list.
  const activeQuery = {
    search: asText(users.filters.search),
    role: asEnum(users.filters.role, ROLES),
    sort: asText(users.filters.sort),
    order: asEnum(users.filters.order, ORDERS),
  };


  const csv = useCsvExport({
    fetchPage: (page, pageSize) =>
      listUsers({ ...activeQuery, page, pageSize }),
    headers: EXPORT_HEADERS,
    toRow: toExportRow,
    filename: "users",
  });

  const roleSplit: Segment[] = useMemo(() => {
    const admins = users.items.filter((user) => user.role === "ADMIN").length;
    const cas = users.items.filter((user) => user.role === "CA").length;
    return [
      { label: "Admins", value: admins, tone: "blue" },
      { label: "CAs", value: cas, tone: "amber" },
      {
        label: "Users",
        value: users.items.length - admins - cas,
        tone: "neutral",
      },
    ];
  }, [users.items]);

  const [pending, setPending] = useState<{ user: AdminUser; role: Role } | null>(
    null,
  );
  const changeRole = useMutation((id: string, role: Role) =>
    updateUserRole(id, role),
  );

  const columns: Column<AdminUser>[] = [
    {
      key: "user",
      sortKey: "name",
      header: "User",
      primary: true,
      cell: (user) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={user.name} seed={user.email} />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "numeric w-32 text-muted-foreground",
      cell: (user) => user.phone || "—",
    },
    {
      key: "college",
      header: "College",
      className: "text-muted-foreground",
      cell: (user) => user.college || "—",
    },
    {
      key: "district",
      header: "District",
      className: "w-32 text-muted-foreground",
      hideOnMobile: true,
      cell: (user) => user.district || "—",
    },
    {
      key: "referralCode",
      header: "Referral code",
      className: "numeric w-28 text-muted-foreground",
      // TIQR issues this, and only once a CA with a complete profile first
      // asks for it — so a blank here is normal, not missing data.
      cell: (user) => user.referralCode ?? "—",
    },
    {
      key: "role",
      header: "Role",
      className: "w-24",
      cell: (user) => <RoleBadge role={user.role} />,
    },
    {
      key: "roleActions",
      header: "",
      className: "w-36",
      isActions: true,
      cell: (user) => (
        <Select
          aria-label={`Role for ${user.name}`}
          className="h-7 w-32 text-xs"
          value={user.role}
          // A CA cannot be demoted — the backend rejects it with a 400 — so
          // the control is simply not offered rather than failing on use.
          disabled={user.role === "CA" || changeRole.loading}
          onChange={(e) => setPending({ user, role: e.target.value as Role })}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {roleLabel(role)}
            </option>
          ))}
        </Select>
      ),
    },
    {
      key: "createdAt",
      sortKey: "createdAt",
      header: "Joined",
      className: "numeric w-32 text-muted-foreground",
      hideOnMobile: true,
      cell: (user) => formatDate(user.createdAt),
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

        {/* One row on a phone; from sm the children join the parent flex directly,
            so the export button can push itself to the far end. */}
        <div className="flex gap-2 sm:contents">
          <Select
            aria-label="Filter by role"
            className="h-9 w-full sm:h-8 sm:w-36"
            value={users.filters.role ?? ""}
            onChange={(e) => users.setFilter("role", e.target.value)}
          >
            <option value="">All roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </Select>

          <Button
            className="h-9 shrink-0 sm:ml-auto sm:h-7 sm:px-2.5 sm:text-xs"
            loading={csv.exporting}
            disabled={users.total === 0}
            onClick={csv.exportCsv}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {csv.error ? (
        <p className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Export failed. {csv.error.message}
        </p>
      ) : null}
      {changeRole.error ? (
        <p className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {apiErrorMessage(changeRole.error)}
        </p>
      ) : null}
      {csv.truncated ? (
        <p className="rounded-md border border-warning/40 bg-warning/15 px-3 py-2 text-xs text-warning">
          Export stopped at 2000 rows. Narrow the filters to get the rest.
        </p>
      ) : null}

      {users.items.length > 0 ? (
        <DistributionBar
          segments={roleSplit}
          trailing={
            <span className="numeric text-xs text-muted-foreground">
              {users.total} total
            </span>
          }
        />
      ) : null}

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
        cardsBelow="lg"
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
        open={!!pending}
        title="Change role"
        description={
          pending
            ? pending.role === "CA"
              ? `Make ${pending.user.name} a campus ambassador? This cannot be undone — a CA cannot be demoted. It does not create a referral code; TIQR issues one when they first ask for it.`
              : `Change ${pending.user.name}'s role to ${roleLabel(pending.role)}?`
            : undefined
        }
        confirmLabel="Change role"
        destructive={pending?.role === "CA" || pending?.role === "ADMIN"}
        loading={changeRole.loading}
        error={changeRole.error}
        onConfirm={async () => {
          if (!pending) return;
          const result = await changeRole.run(pending.user.id, pending.role);
          if (result) {
            setPending(null);
            users.refetch();
          }
        }}
        onCancel={() => {
          changeRole.reset();
          setPending(null);
        }}
      />
    </div>
  );
}
