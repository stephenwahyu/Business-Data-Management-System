import React, { useState, useEffect } from "react";
import { Head, useForm as useInertiaForm } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ArrowUpDown,
    ChevronDown,
    MoreHorizontal,
    Plus,
    X,
    Eye,
    EyeOff,
} from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Input } from "@/Components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/Components/ui/form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import { Toaster } from "sonner";
import Heading from "@/Components/Heading";
import AppLayout from "@/Layouts/App-Layout";

// Define Zod schema for form validation
const userFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().optional().refine(val => {
        // If password is provided, it must be at least 8 characters
        return !val || val.length >= 8;
    }, { message: "Password must be at least 8 characters" }),
    role_id: z.string().nonempty("Please select a role")
});

export default function Users({ users, roles }) {
    const [sorting, setSorting] = useState([]);
    const [columnFilters, setColumnFilters] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState({});
    const [rowSelection, setRowSelection] = useState({});
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState(null); // 'add', 'view', or 'edit'
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    // New states for delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Inertia form for handling form submission
    const inertiaForm = useInertiaForm({
        id: "",
        name: "",
        email: "",
        password: "",
        role_id: "",
    });

    // React Hook Form with Zod validation
    const form = useForm({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role_id: ""
        }
    });

    // Update form values when editing a user
    useEffect(() => {
        if (sheetMode === 'edit' && selectedUser) {
            form.reset({
                name: selectedUser.name,
                email: selectedUser.email,
                password: "",
                role_id: selectedUser.role_id.toString()
            });
        } else if (sheetMode === 'add') {
            form.reset({
                name: "",
                email: "",
                password: "",
                role_id: ""
            });
        }
    }, [sheetMode, selectedUser]);

    // Handle success or error messages from Inertia
    useEffect(() => {
        const { flash } = window;
        if (flash && flash.message) {
            toast.success(flash.message);
        }
        if (flash && flash.error) {
            toast.error(flash.error);
        }
    }, []);

    const handleAddClick = () => {
        inertiaForm.reset();
        setSelectedUser(null);
        setSheetMode("add");
        setSheetOpen(true);
        setShowPassword(false);
    };

    const handleViewClick = (user) => {
        setSelectedUser(user);
        setSheetMode("view");
        setSheetOpen(true);
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setSheetMode("edit");
        setSheetOpen(true);
        setShowPassword(false);
    };

    const handleSubmit = (data) => {
        // Copy form data to process
        const formData = {...data};
        
        // Extract role_id as int
        formData.role_id = parseInt(formData.role_id);
        
        // Only include password if it was actually provided
        if (!formData.password) {
            delete formData.password;
        }

        if (sheetMode === "add") {
            router.post("/users", formData, {
                onSuccess: () => {
                    setSheetOpen(false);
                    form.reset();
                    toast.success("User created successfully");
                },
                onError: (errors) => {
                    // Set form errors from server
                    Object.keys(errors).forEach(key => {
                        form.setError(key, { 
                            type: "server", 
                            message: errors[key] 
                        });
                    });
                    toast.error("Failed to create user");
                }
            });
        } else if (sheetMode === "edit" && selectedUser) {
            // Add the user ID for the backend
            formData.id = selectedUser.id;
            
            router.put(`/users/${selectedUser.id}`, formData, {
                onSuccess: () => {
                    setSheetOpen(false);
                    toast.success("User updated successfully");
                },
                onError: (errors) => {
                    // Set form errors from server
                    Object.keys(errors).forEach(key => {
                        form.setError(key, { 
                            type: "server", 
                            message: errors[key] 
                        });
                    });
                    toast.error("Failed to update user");
                }
            });
        }
    };

    // Updated delete handling flow
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!userToDelete) return;
        
        router.delete(`/users/${userToDelete.id}`, {
            onSuccess: () => {
                toast.success("User deleted successfully");
                setDeleteDialogOpen(false);
                setUserToDelete(null);
            },
            onError: () => {
                toast.error("Failed to delete user");
                setDeleteDialogOpen(false);
            }
        });
    };

    const cancelDelete = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const getRoleName = (roleId) => {
        const role = roles.find(role => role.id === roleId);
        return role ? role.name : 'Unknown';
    };

    const columns = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Name <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "email",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Email <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.getValue("email")}</div>,
        },
        {
            accessorKey: "role_id",
            header: "Role",
            cell: ({ row }) => {
                const roleId = row.getValue("role_id");
                return <div className="capitalize">{getRoleName(roleId)}</div>;
            },
        },
        {
            accessorKey: "email_verified_at",
            header: "Verified",
            cell: ({ row }) => {
                const verifiedAt = row.getValue("email_verified_at");
                return verifiedAt ? (
                    <div className="text-green-600">✓</div>
                ) : (
                    <div className="text-gray-400">-</div>
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const user = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() =>
                                    navigator.clipboard.writeText(user.id.toString())
                                }
                            >
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleViewClick(user)}
                            >
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleEditClick(user)}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDeleteClick(user)}
                                className="text-red-600"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data: users,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: { sorting, columnFilters, columnVisibility, rowSelection },
    });

    // Helper function to generate the sheet title based on the mode
    const getSheetTitle = () => {
        switch (sheetMode) {
            case "add":
                return "Add New User";
            case "view":
                return "User Details";
            case "edit":
                return "Edit User";
            default:
                return "";
        }
    };

    return (
        <AppLayout>
            <Head title="Users" />
            <Heading title="Users" description="Manage your system users" />
            <Toaster position="top-right" />

            <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Filter by name..."
                        value={
                            table.getColumn("name")?.getFilterValue() || ""
                        }
                        onChange={(event) =>
                            table
                                .getColumn("name")
                                ?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Columns <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Button onClick={handleAddClick}>
                    <Plus className="h-4 w-4" /> 
                    <span className="hidden sm:inline ml-2">Add User</span>
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Sheet for Add/View/Edit */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="min-w-[30vw] w-full sm:min-w-[35vw] overflow-y-auto flex flex-col max-h-full">
                    <SheetHeader className="sticky top-0 z-10 bg-background pb-4">
                        <SheetTitle>{getSheetTitle()}</SheetTitle>
                        <SheetDescription>
                            {sheetMode === "add" &&
                                "Add a new user to the system."}
                            {sheetMode === "view" && "View user details."}
                            {sheetMode === "edit" &&
                                "Make changes to user information."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto pr-1">
                        {sheetMode === "view" && selectedUser && (
                            <div className="grid gap-4 p-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">ID</Label>
                                    <div className="col-span-3">
                                        {selectedUser.id}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Name</Label>
                                    <div className="col-span-3">
                                        {selectedUser.name}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Email</Label>
                                    <div className="col-span-3">
                                        {selectedUser.email}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Role</Label>
                                    <div className="col-span-3 capitalize">
                                        {getRoleName(selectedUser.role_id)}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Verified</Label>
                                    <div className="col-span-3">
                                        {selectedUser.email_verified_at ? 
                                            `Yes (${new Date(selectedUser.email_verified_at).toLocaleString()})` : 
                                            "No"}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Created</Label>
                                    <div className="col-span-3">
                                        {new Date(selectedUser.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Last Updated</Label>
                                    <div className="col-span-3">
                                        {new Date(selectedUser.updated_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(sheetMode === "add" || sheetMode === "edit") && (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="p-4 space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem className="grid grid-cols-4 items-center gap-4">
                                                <FormLabel className="text-right">Name</FormLabel>
                                                <div className="col-span-3">
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="grid grid-cols-4 items-center gap-4">
                                                <FormLabel className="text-right">Email</FormLabel>
                                                <div className="col-span-3">
                                                    <FormControl>
                                                        <Input type="email" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem className="grid grid-cols-4 items-center gap-4">
                                                <FormLabel className="text-right">Password</FormLabel>
                                                <div className="col-span-3 relative">
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input 
                                                                type={showPassword ? "text" : "password"} 
                                                                {...field} 
                                                                placeholder={sheetMode === "edit" ? "Leave blank to keep current password" : ""}
                                                            />
                                                            <button 
                                                                type="button"
                                                                onClick={togglePasswordVisibility}
                                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                            >
                                                                {showPassword ? (
                                                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    {sheetMode === "edit" && (
                                                        <FormDescription>
                                                            Leave blank to keep current password
                                                        </FormDescription>
                                                    )}
                                                    <FormMessage />
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="role_id"
                                        render={({ field }) => (
                                            <FormItem className="grid grid-cols-4 items-center gap-4">
                                                <FormLabel className="text-right">Role</FormLabel>
                                                <div className="col-span-3">
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {roles.map((role) => (
                                                                <SelectItem key={role.id} value={role.id.toString()}>
                                                                    {role.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        )}
                    </div>

                    <SheetFooter className="sticky bottom-0 z-10 bg-background pt-2 mt-auto">
                        {sheetMode === "view" && (
                            <>
                                <SheetClose asChild>
                                    <Button type="button" variant="outline">
                                        Close
                                    </Button>
                                </SheetClose>
                                <Button
                                    type="button"
                                    onClick={() => handleEditClick(selectedUser)}
                                >
                                    Edit
                                </Button>
                            </>
                        )}

                        {(sheetMode === "add" || sheetMode === "edit") && (
                            <>
                                <SheetClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </SheetClose>
                                <Button
                                    type="button"
                                    disabled={form.formState.isSubmitting}
                                    onClick={form.handleSubmit(handleSubmit)}
                                >
                                    {sheetMode === "add" ? "Add User" : "Save Changes"}
                                </Button>
                            </>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToDelete && (
                                <>
                                    Are you sure you want to delete the user <span className="font-semibold">{userToDelete.name}</span>?
                                    <br />
                                    This action cannot be undone.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}