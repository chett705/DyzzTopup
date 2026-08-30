import React from 'react'

export  function Loading() {
  return (
    <div className='min-h-screen w-full flex items-center justify-center bg-zinc-950 text-white'>
      <div className='border border-zinc-800 bg-zinc-900/50 backdrop-blur-md mx-auto rounded-2xl px-8 py-10 shadow-2xl flex flex-col items-center space-y-6 max-w-sm w-full mx-4'>
        
        <div className='relative flex items-center justify-center'>
          <div className='absolute w-16 h-16 border-4 border-indigo-500/20 rounded-full'></div>
          <div className='w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin'></div>
        </div>

        <div className='text-center space-y-2'>
          <h1 className='text-xl font-bold tracking-tight text-zinc-100'>Dyzz Store</h1>
          <p className='text-sm text-zinc-400'>We are currently performing scheduled maintenance to improve your experience. Please check back soon.</p>
          <h6 className=' font-medium'>We'll be right Back </h6>
        </div>

        {/* <div className='w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden'>
          <div className='bg-indigo-500 h-full w-1/3 animate-pulse rounded-full'></div>
        </div> */}

      </div>
    </div>
  )
}

export default Loading
