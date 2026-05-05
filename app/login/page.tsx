import LoginComponent from '@/components/auth/login-component'
import React from 'react'

const 登录Page = () => {
  return (
 <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginComponent />
      </div>
    </div>
  )
}

export default 登录Page