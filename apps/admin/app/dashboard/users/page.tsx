"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Badge } from "@workspace/ui/components/badge";

export default function ManageUsersPage() {
  const [users, setUsers] = useState([
    { id: "1", name: "Somchai Jaidee", email: "somchai@example.com", role: "staff", status: "Active" },
    { id: "2", name: "Suda Yindee", email: "suda@example.com", role: "admin", status: "Active" },
    { id: "3", name: "Mana Rakthai", email: "mana@example.com", role: "customer", status: "Inactive" },
  ]);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">จัดการผู้ใช้ (Manage Users)</h2>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>+ เพิ่มผู้ใช้ (Add User)</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
                <DialogDescription>
                  ระบุข้อมูลสำหรับผู้ใช้ใหม่และกำหนดสิทธิ์การเข้าถึงระบบ
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    ชื่อ-สกุล
                  </Label>
                  <Input id="name" placeholder="สมชาย ใจดี" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    อีเมล
                  </Label>
                  <Input id="email" type="email" placeholder="example@musicgear.com" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    สิทธิ์
                  </Label>
                  <div className="col-span-3">
                    <Select defaultValue="staff">
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสิทธิ์" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">บันทึกข้อมูล</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ-สกุล</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead>สิทธิ์ (Role)</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role === "admin" && <Badge variant="default" className="bg-red-500 hover:bg-red-600">Admin</Badge>}
                  {user.role === "staff" && <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">Staff</Badge>}
                  {user.role === "customer" && <Badge variant="outline">Customer</Badge>}
                </TableCell>
                <TableCell>
                  {user.status === "Active" ? (
                    <span className="text-green-600 font-medium text-sm">Active</span>
                  ) : (
                    <span className="text-gray-400 font-medium text-sm">Inactive</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">แก้ไข</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
