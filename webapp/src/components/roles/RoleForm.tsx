import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Save,
  CheckSquare,
  Square,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Users,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

type FormData = z.infer<typeof formSchema>;

interface Permission {
  id: string;
  code: string;
  description: string | null;
  category: string | null;
}

interface GroupedPermissions {
  [category: string]: Permission[];
}

interface RoleData {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions?: Permission[];
  permissionIds?: string[];
}

interface RoleFormProps {
  mode: 'create' | 'edit';
  roleData?: RoleData;
  permissionsData?: {
    groupedPermissions: GroupedPermissions;
  };
  isLoading?: boolean;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function RoleForm({
  mode,
  roleData,
  permissionsData,
  isLoading,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RoleFormProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  // Set form values when role data is loaded (edit mode)
  useEffect(() => {
    if (mode === 'edit' && roleData) {
      const permissionIds = roleData.permissionIds || [];

      form.reset({
        name: roleData.name || '',
        description: roleData.description || '',
        permissions: permissionIds,
      });

      setSelectedPermissions(permissionIds);
    }
  }, [roleData, form, mode]);

  // Expand all categories by default
  useEffect(() => {
    if (permissionsData?.groupedPermissions) {
      setExpandedCategories(new Set(Object.keys(permissionsData.groupedPermissions)));
    }
  }, [permissionsData]);

  // Handle permission checkbox changes
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => {
        const newPermissions = [...prev, permissionId];
        form.setValue('permissions', newPermissions, { shouldDirty: true, shouldTouch: true });
        return newPermissions;
      });
    } else {
      setSelectedPermissions(prev => {
        const newPermissions = prev.filter(id => id !== permissionId);
        form.setValue('permissions', newPermissions, { shouldDirty: true, shouldTouch: true });
        return newPermissions;
      });
    }
  };

  // Handle select all permissions
  const handleSelectAll = () => {
    if (!permissionsData?.groupedPermissions) return;

    const allPermissionIds = Object.values(permissionsData.groupedPermissions)
      .flat()
      .map(p => p.id);

    setSelectedPermissions(allPermissionIds);
    form.setValue('permissions', allPermissionIds, { shouldDirty: true, shouldTouch: true });
    toast.success(`Selected ${allPermissionIds.length} permissions`);
  };

  // Handle deselect all permissions
  const handleDeselectAll = () => {
    setSelectedPermissions([]);
    form.setValue('permissions', [], { shouldDirty: true, shouldTouch: true });
    toast.success('Deselected all permissions');
  };

  // Handle select all in category
  const handleSelectCategory = (category: string) => {
    if (!permissionsData?.groupedPermissions) return;

    const categoryPermissions = permissionsData.groupedPermissions[category] || [];
    const categoryPermissionIds = categoryPermissions.map(p => p.id);

    const newPermissions = [...new Set([...selectedPermissions, ...categoryPermissionIds])];
    setSelectedPermissions(newPermissions);
    form.setValue('permissions', newPermissions, { shouldDirty: true, shouldTouch: true });
    toast.success(`Selected all ${category} permissions`);
  };

  // Handle deselect all in category
  const handleDeselectCategory = (category: string) => {
    if (!permissionsData?.groupedPermissions) return;

    const categoryPermissions = permissionsData.groupedPermissions[category] || [];
    const categoryPermissionIds = categoryPermissions.map(p => p.id);

    const newPermissions = selectedPermissions.filter(id => !categoryPermissionIds.includes(id));
    setSelectedPermissions(newPermissions);
    form.setValue('permissions', newPermissions, { shouldDirty: true, shouldTouch: true });
    toast.success(`Deselected all ${category} permissions`);
  };

  // Get category selection state
  const getCategoryState = (category: string) => {
    if (!permissionsData?.groupedPermissions) return 'none';

    const categoryPermissions = permissionsData.groupedPermissions[category] || [];
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    const selectedCount = categoryPermissionIds.filter(id =>
      selectedPermissions.includes(id)
    ).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryPermissionIds.length) return 'all';
    return 'some';
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Filter permissions based on search term
  const getFilteredPermissions = () => {
    if (!permissionsData?.groupedPermissions) return {};

    const filtered: GroupedPermissions = {};

    Object.entries(permissionsData.groupedPermissions).forEach(([category, permissions]) => {
      const filteredPermissions = permissions.filter(permission => {
        const matchesSearch =
          searchTerm === '' ||
          permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          permission.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = !showOnlySelected || selectedPermissions.includes(permission.id);

        return matchesSearch && matchesFilter;
      });

      if (filteredPermissions.length > 0) {
        filtered[category] = filteredPermissions;
      }
    });

    return filtered;
  };

  async function handleSubmit(values: FormData) {
    const submitData = {
      ...values,
      permissions: selectedPermissions,
    };
    await onSubmit(submitData);
  }

  const isSystemRole = roleData?.isSystem || false;
  const totalPermissions = permissionsData?.groupedPermissions
    ? Object.values(permissionsData.groupedPermissions).flat().length
    : 0;
  const filteredPermissions = getFilteredPermissions();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Card className="bg-secondary p-6">
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            </Card>
          </div>
          <div className="lg:col-span-8">
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Basic Info Sidebar */}
        <div className="lg:col-span-4">
          <Card className="bg-secondary p-6 sticky top-[45px] self-start">
            <CardContent className="px-0 pt-0">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Role Information</h3>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Role Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter role name" {...field} disabled={isSystemRole} />
                        </FormControl>
                        {isSystemRole && (
                          <FormDescription className="text-amber-600">
                            System role names cannot be changed
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter role description"
                            rows={4}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe what this role is for and what kind of users should have it.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Permission Summary */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Permission Summary</h4>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Selected Permissions</span>
                        <Badge variant="secondary" className="font-medium">
                          {selectedPermissions.length} of {totalPermissions}
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${totalPermissions > 0 ? (selectedPermissions.length / totalPermissions) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting
                        ? mode === 'create'
                          ? 'Creating...'
                          : 'Saving...'
                        : mode === 'create'
                          ? 'Create Role'
                          : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={onCancel} className="w-full">
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Main Permissions Area */}
        <div className="lg:col-span-8">
          <Card className="bg-secondary mr-2.5 p-6 mb-2.5">
            <CardContent className="px-0 pt-0">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">Assign Permissions</h2>
              </div>

              {isSystemRole ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-bold mb-2">System Role</p>
                      <p className="text-sm">
                        System role permissions are managed automatically and cannot be modified.
                        {roleData?.name === 'admin' && ' Admin role has full system access.'}
                        {roleData?.name === 'client' && ' Client role has no special permissions.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Controls Bar */}
                  <div className="bg-muted/30 rounded-lg p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Search */}
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search permissions..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Filter Toggle */}
                      <Button
                        type="button"
                        variant={showOnlySelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowOnlySelected(!showOnlySelected)}
                        className="shrink-0"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {showOnlySelected ? 'Show All' : 'Show Selected'}
                      </Button>

                      {/* Global Actions */}
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDeselectAll}
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Permissions List */}
                  {Object.keys(filteredPermissions).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(filteredPermissions).map(([category, permissions]) => {
                        const categoryState = getCategoryState(category);
                        const isExpanded = expandedCategories.has(category);
                        const selectedInCategory = permissions.filter(p =>
                          selectedPermissions.includes(p.id)
                        ).length;

                        return (
                          <Card key={category} className="border-2 transition-all">
                            {/* Category Header */}
                            <CardHeader
                              className="cursor-pointer hover:bg-accent/50 transition-colors"
                              onClick={() => toggleCategory(category)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <CardTitle className="text-lg">{category}</CardTitle>
                                  <Badge variant="outline">
                                    {selectedInCategory}/{permissions.length}
                                  </Badge>
                                  {categoryState === 'all' && (
                                    <Badge
                                      variant="default"
                                      className="bg-green-100 text-green-800"
                                    >
                                      All Selected
                                    </Badge>
                                  )}
                                  {categoryState === 'some' && (
                                    <Badge variant="secondary">Partially Selected</Badge>
                                  )}
                                </div>

                                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                  {categoryState !== 'all' && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSelectCategory(category)}
                                    >
                                      Select All
                                    </Button>
                                  )}
                                  {categoryState !== 'none' && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeselectCategory(category)}
                                    >
                                      Clear
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardHeader>

                            {/* Category Content */}
                            {isExpanded && (
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {permissions.map(permission => {
                                    const isChecked = selectedPermissions.includes(permission.id);
                                    return (
                                      <div
                                        key={permission.id}
                                        className={`
                                          flex items-start p-4 border-2 rounded-lg transition-all cursor-pointer hover:bg-accent/30
                                          ${isChecked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}
                                        `}
                                        onClick={() =>
                                          handlePermissionChange(permission.id, !isChecked)
                                        }
                                      >
                                        <Checkbox
                                          id={permission.id}
                                          checked={isChecked}
                                          onCheckedChange={checked => {
                                            handlePermissionChange(
                                              permission.id,
                                              checked as boolean
                                            );
                                          }}
                                          className="mt-1"
                                        />
                                        <div className="ml-3 flex-1">
                                          <label
                                            htmlFor={permission.id}
                                            className="text-sm font-medium leading-tight cursor-pointer block mb-1"
                                          >
                                            {permission.description || permission.code}
                                          </label>
                                          <p className="text-xs text-muted-foreground">
                                            {permission.code}
                                          </p>
                                        </div>
                                        {isChecked && (
                                          <div className="ml-2">
                                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 inline-block">
                        <div className="font-medium mb-2 text-yellow-800">
                          {searchTerm || showOnlySelected
                            ? 'No permissions match your search'
                            : 'No permissions found'}
                        </div>
                        <p className="text-sm text-yellow-700">
                          {searchTerm || showOnlySelected
                            ? 'Try adjusting your search or filter settings.'
                            : 'Contact an administrator to set up permissions for this system.'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
