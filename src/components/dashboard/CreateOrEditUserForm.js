import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Calendar } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { requestHandler } from '../../lib/utils/network-client';
import useToast from '../../hooks/useToast';
const getSchema = (type) => z.object({
    first_name: z.string().min(1, 'Please enter first name'),
    last_name: z.string().min(1, 'Please enter last name'),
    email: z.string().email('Please enter a valid email address'),
    phone_number: z.string()
        .min(1, 'Please enter phone number')
        .regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),
    dob: z.string().min(1, 'Please select date of birth'),
    role: z.string().min(1, 'Please select a role'),
    status: z.string().min(1, 'Please select status'),
    password: z.string().optional().superRefine((val, ctx) => {
        // If create mode, password is required
        if (type === 'create' && (!val || val.length === 0)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Password is required',
            });
            return;
        }

        // If empty (and allowed to be empty by type==edit), skip checks
        if (!val) return;

        if (val.length < 8) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Password must be at least 8 characters',
            });
        }
        if (val.length > 16) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Password cannot exceed 16 characters',
            });
        }
        if (
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/.test(
                val,
            )
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
            });
        }
    }),
});

const CreateOrEditUserForm = ({
    setIsOpen,
    isOpen,
    type,
    editableUser,
    fetchUsers,
}) => {
    const { showSuccessToast, showErrorToast } = useToast();
    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(getSchema(type)),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            phone_number: '',
            dob: '',
            role: '',
            status: 'active',
        },
    });

    const [showPassword, setShowPassword] = useState(false);
    const [roles, setRoles] = useState([
        { name: 'Admin', slug: 'admin' },
        { name: 'Manager', slug: 'manager' },
        { name: 'HR', slug: 'hr' },
    ]);

    useEffect(() => {
        const fetchRoles = async () => {
            const response = await requestHandler('/roles');
            if (response.success) {
                setRoles(
                    (response.data.roles || [])
                        .filter((role) => role.status === 'active')
                        .map((role) => ({ name: role.name, slug: role.slug })),
                );
            }
        };

        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen]);

    useEffect(() => {
        if (type === 'edit' && editableUser) {
            // Format dob to YYYY-MM-DD for date input
            let formattedDob = '';
            if (editableUser.dob) {
                const dobDate = new Date(editableUser.dob);
                if (!isNaN(dobDate.getTime())) {
                    formattedDob = dobDate.toISOString().split('T')[0];
                }
            }

            reset({
                first_name: editableUser.first_name,
                last_name: editableUser.last_name,
                email: editableUser.email,
                phone_number: editableUser.phone_number || '',
                dob: formattedDob,
                role: (() => {
                    const r = (editableUser.role || "").toLowerCase();
                    if (r === "admin") return "admin";
                    if (r === "manager") return "manager";
                    if (r === "hr") return "hr";
                    return r;
                })(),
                status: editableUser.status,
            });
        } else {
            reset({
                first_name: '',
                last_name: '',
                email: '',
                phone_number: '',
                dob: '',
                role: '',
                status: 'active',
            });
        }
    }, [type, editableUser, reset, isOpen]);

    const onSubmit = async (data) => {
        try {
            const url = type === 'edit' ? `/users/${editableUser.id}` : '/users/create';
            const method = type === 'edit' ? 'PUT' : 'POST';

            const response = await requestHandler(url, {
                method,
                body: data,
            });

            if (response.success) {
                showSuccessToast(response.message || `User ${type === 'edit' ? 'updated' : 'created'} successfully`);
                setIsOpen(false);
                fetchUsers();
            } else {
                showErrorToast(response.message || 'Operation failed');
            }
        } catch (error) {
            console.error(error);
            showErrorToast('Something went wrong');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className='w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-hidden p-0 bg-white border-0 shadow-2xl flex flex-col text-left [&>button]:!text-white [&>button]:top-5 [&>button]:right-5 [&>button]:focus:ring-0 [&>button]:focus:outline-none [&>button]:transition-all [&>button>svg]:w-6 [&>button>svg]:h-6 [&>button>svg]:stroke-[3]'>
                {/* Header with Gradient */}
                <DialogHeader className='p-6 bg-gradient-to-r from-primary via-primary-hover to-primary text-white shrink-0'>
                    <DialogTitle className='text-2xl font-bold flex items-center gap-2'>
                        {type === 'edit' ? 'Edit User Details' : 'Create New User'}
                    </DialogTitle>
                    <p className='text-blue-50 text-sm mt-1 text-left'>
                        {type === 'edit'
                            ? 'Update the information below to modify the user account.'
                            : 'Fill in the details below to create a new user account.'}
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className='flex-1 flex flex-col min-h-0'>
                    {type === 'edit' && !editableUser ? (
                        <div className='flex-1 flex items-center justify-center p-12 min-h-[300px]'>
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            <div className='flex-1 overflow-y-auto p-6 space-y-4 sm:space-y-5'>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5'>
                                    <div className='space-y-2'>
                                        <Label htmlFor='first_name' className='text-gray-700 font-semibold'>
                                            First Name <span className='text-red-500'>*</span>
                                        </Label>
                                        <Input
                                            id='first_name'
                                            placeholder='Enter your first name'
                                            {...register('first_name')}
                                            className='h-10 border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#3a5f9e] text-gray-900 placeholder:text-gray-400'
                                        />
                                        {errors.first_name && (
                                            <p className='text-red-500 text-xs font-medium mt-1'>{errors.first_name.message}</p>
                                        )}
                                    </div>
                                    <div className='space-y-2'>
                                        <Label htmlFor='last_name' className='text-gray-700 font-semibold'>
                                            Last Name <span className='text-red-500'>*</span>
                                        </Label>
                                        <Input
                                            id='last_name'
                                            placeholder='Enter your last name'
                                            {...register('last_name')}
                                            className='h-10 border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#3a5f9e] text-gray-900 placeholder:text-gray-400'
                                        />
                                        {errors.last_name && (
                                            <p className='text-red-500 text-xs font-medium mt-1'>{errors.last_name.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <Label htmlFor='email' className='text-gray-700 font-semibold'>
                                        Email Address <span className='text-red-500'>*</span>
                                    </Label>
                                    <Input
                                        id='email'
                                        type='email'
                                        placeholder='Enter your email address'
                                        {...register('email')}
                                        className='h-10 border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#3a5f9e] text-gray-900 placeholder:text-gray-400'
                                    />
                                    {errors.email && <p className='text-red-500 text-xs font-medium mt-1'>{errors.email.message}</p>}
                                </div>

                                <div className='space-y-2'>
                                    <Label htmlFor='password' className='text-gray-700 font-semibold'>
                                        Password{' '}
                                        {type === 'edit' ? (
                                            <span className='text-gray-400 text-xs font-normal ml-1'>(Optional)</span>
                                        ) : (
                                            <span className='text-red-500'>*</span>
                                        )}
                                    </Label>
                                    <div className='relative'>
                                        <Input
                                            id='password'
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder={type === 'edit' ? 'Leave blank to keep current' : 'Enter your password'}
                                            {...register('password')}
                                            className='h-10 pr-10 border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#3a5f9e] text-gray-900 placeholder:text-gray-400'
                                        />
                                        <button
                                            type='button'
                                            onClick={() => setShowPassword(!showPassword)}
                                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#3a5f9e] transition-colors focus:outline-none'
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {/* Live Password Requirements - Only show in create mode or when typing in edit mode */}
                                    {(type === 'create' || (type === 'edit' && watch('password'))) && (
                                        <div className='mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]'>
                                            <div className={`flex items-center gap-1.5 ${watch('password')?.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                                                <span className={`font-bold ${watch('password')?.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {watch('password')?.length >= 8 ? '✓' : '×'}
                                                </span>
                                                <span>At least 8 characters</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${watch('password')?.length <= 16 && watch('password')?.length > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                <span className={`font-bold ${watch('password')?.length <= 16 && watch('password')?.length > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {watch('password')?.length <= 16 && watch('password')?.length > 0 ? '✓' : '×'}
                                                </span>
                                                <span>Maximum 16 characters</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(watch('password') || '') ? 'text-green-600' : 'text-red-500'}`}>
                                                <span className={`font-bold ${/[A-Z]/.test(watch('password') || '') ? 'text-green-600' : 'text-red-500'}`}>
                                                    {/[A-Z]/.test(watch('password') || '') ? '✓' : '×'}
                                                </span>
                                                <span>One uppercase letter</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${/[a-z]/.test(watch('password') || '') ? 'text-green-600' : 'text-red-500'}`}>
                                                <span className={`font-bold ${/[a-z]/.test(watch('password') || '') ? 'text-green-600' : 'text-red-500'}`}>
                                                    {/[a-z]/.test(watch('password') || '') ? '✓' : '×'}
                                                </span>
                                                <span>One lowercase letter</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${/\d/.test(watch('password') || '') ? 'text-green-600' : 'text-red-500'}`}>
                                                <span className={`font-bold ${/\d/.test(watch('password') || '') ? 'text-green-600' : 'text-red-500'}`}>
                                                    {/\d/.test(watch('password') || '') ? '✓' : '×'}
                                                </span>
                                                <span>One number</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${/[@$!%*?&#]/.test(watch('password') || '') ? 'text-green-600' : 'text-red-500'}`}>
                                                <span className={`font-bold ${/[@$!%*?&#]/.test(watch('password') || '') ? 'text-green-600' : 'text-red-500'}`}>
                                                    {/[@$!%*?&#]/.test(watch('password') || '') ? '✓' : '×'}
                                                </span>
                                                <span>One special character (@$!%*?&#)</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5'>
                                    <div className='space-y-2'>
                                        <Label htmlFor='phone_number' className='text-gray-700 font-semibold'>
                                            Phone Number <span className='text-red-500'>*</span>
                                        </Label>
                                        <Input
                                            id='phone_number'
                                            type='tel'
                                            placeholder='Enter your phone number'
                                            maxLength={10}
                                            {...register('phone_number')}
                                            onInput={(e) => {
                                                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                                            }}
                                            className='h-10 border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#3a5f9e] text-gray-900 placeholder:text-gray-400'
                                        />
                                        {errors.phone_number && (
                                            <p className='text-red-500 text-xs font-medium mt-1'>{errors.phone_number.message}</p>
                                        )}
                                    </div>

                                    <div className='space-y-2'>
                                        <Label className='text-gray-700 font-semibold'>
                                            Date of Birth <span className='text-red-500'>*</span>
                                        </Label>
                                        <div className="relative group">
                                            {/* Visible Display Input (Formatted) */}
                                            <Input
                                                type='text'
                                                readOnly
                                                placeholder='DD-MM-YYYY'
                                                value={(() => {
                                                    const val = watch('dob');
                                                    if (!val) return '';
                                                    const [y, m, d] = val.split('-');
                                                    return `${d}-${m}-${y}`;
                                                })()}
                                                className='h-10 pr-10 border-gray-300 text-gray-900 placeholder:text-gray-400 bg-white'
                                            />

                                            {/* Custom Icon */}
                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none group-hover:text-[#3a5f9e] transition-colors" />

                                            {/* Invisible Native Date Picker Layer */}
                                            <Input
                                                id='dob'
                                                type='date'
                                                {...register('dob')}
                                                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                                                style={{ colorScheme: 'light' }}
                                                onClick={(e) => {
                                                    // Force open picker on desktop click
                                                    try {
                                                        if (e.target.showPicker) e.target.showPicker();
                                                    } catch (err) {
                                                        // Fallback or ignore if not supported
                                                    }
                                                }}
                                            />
                                        </div>
                                        {errors.dob && <p className='text-red-500 text-xs font-medium mt-1'>{errors.dob.message}</p>}
                                    </div>
                                </div>

                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5'>
                                    <div className='space-y-2'>
                                        <Label htmlFor='role' className='text-gray-700 font-semibold'>
                                            Role <span className='text-red-500'>*</span>
                                        </Label>
                                        <Controller
                                            control={control}
                                            name='role'
                                            render={({ field }) => (
                                                <Select
                                                    key={field.value}
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                >
                                                    <SelectTrigger className='h-10 border-gray-300 focus:ring-0 focus:ring-offset-0 focus:border-[#3a5f9e] text-gray-900'>
                                                        <SelectValue placeholder='Select Role' />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {roles.map((role) => (
                                                            <SelectItem key={role.slug} value={role.slug}>
                                                                {role.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.role && <p className='text-red-500 text-xs font-medium mt-1'>{errors.role.message}</p>}
                                    </div>
                                    <div className='space-y-2'>
                                        <Label htmlFor='status' className='text-gray-700 font-semibold'>
                                            Status <span className='text-red-500'>*</span>
                                        </Label>
                                        <Controller
                                            control={control}
                                            name='status'
                                            render={({ field }) => (
                                                <Select
                                                    key={field.value}
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                >
                                                    <SelectTrigger className='h-10 border-gray-300 focus:ring-0 focus:ring-offset-0 focus:border-[#3a5f9e] text-gray-900'>
                                                        <SelectValue placeholder='Select Status' />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value='active'>
                                                            <span className='flex items-center gap-2'>
                                                                <span className='w-2 h-2 rounded-full bg-green-500'></span>
                                                                Active
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value='inactive'>
                                                            <span className='flex items-center gap-2'>
                                                                <span className='w-2 h-2 rounded-full bg-red-500'></span>
                                                                Inactive
                                                            </span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.status && <p className='text-red-500 text-xs font-medium mt-1'>{errors.status.message}</p>}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className='p-6 border-t bg-gray-50/50 mt-auto flex flex-col gap-3 sm:flex-row sm:gap-2 sm:justify-end'>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type='submit'
                                    disabled={isSubmitting}
                                    className='bg-gradient-to-r from-primary via-primary-hover to-primary text-white hover:opacity-90 transition-opacity'
                                >
                                    {isSubmitting ? (
                                        'Processing...'
                                    ) : type === 'edit' ? (
                                        'Update'
                                    ) : (
                                        'Create'
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateOrEditUserForm;
