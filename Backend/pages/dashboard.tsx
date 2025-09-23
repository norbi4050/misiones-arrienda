// pages/dashboard.tsx (ejemplo)
import { GetServerSideProps } from 'next'
import { createSupabaseServer } from '../lib/supabase/server'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  return { props: {} }
}

export default function Dashboard() { 
  return <div>Dashboard</div> 
}
