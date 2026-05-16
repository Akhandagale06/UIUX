"use client"
import React, { useEffect, useState } from 'react'
import Header from '../_shared/Header'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import Link from 'next/link'
import { Plus, Layout, Smartphone, Monitor } from 'lucide-react'

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const result = await axios.get('/api/user-projects');
            setProjects(result.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />
            <div className='p-10 md:px-20 lg:px-32'>
                <div className='flex justify-between items-center'>
                    <div>
                        <h2 className='text-3xl font-bold'>My Projects</h2>
                        <p className='text-slate-500'>Manage and view your generated UI designs</p>
                    </div>
                    <Link href={'/'}>
                        <Button className="flex gap-2">
                            <Plus className='h-4 w-4' /> Create New
                        </Button>
                    </Link>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10'>
                    {loading ? (
                        [1, 2, 3].map((item) => (
                            <div key={item} className='h-48 bg-slate-200 animate-pulse rounded-xl'></div>
                        ))
                    ) : projects.length > 0 ? (
                        projects.map((project, index) => (
                            <Link href={'/project/' + project.projectId} key={index}>
                                <div className='p-6 bg-white border rounded-xl hover:shadow-lg transition-all cursor-pointer group'>
                                    <div className='flex justify-between items-start'>
                                        <div className='p-3 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors'>
                                            {project.device === 'Mobile' ? <Smartphone className='h-6 w-6' /> : <Monitor className='h-6 w-6' />}
                                        </div>
                                        <span className='text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600'>
                                            {project.theme?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h3 className='mt-4 font-bold text-lg line-clamp-1'>{project.projectName || 'Untitled Project'}</h3>
                                    <p className='text-slate-500 text-sm mt-1 line-clamp-2'>{project.userInput}</p>
                                    <div className='mt-4 pt-4 border-t flex items-center text-primary font-medium text-sm'>
                                        View Design <Layout className='ml-2 h-4 w-4' />
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className='col-span-full flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-dashed'>
                            <Layout className='h-12 w-12 text-slate-300 mb-4' />
                            <h3 className='text-xl font-medium text-slate-900'>No projects found</h3>
                            <p className='text-slate-500 mt-1'>Start by creating your first AI-generated design!</p>
                            <Link href={'/'} className='mt-6'>
                                <Button>Generate Your First App</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
