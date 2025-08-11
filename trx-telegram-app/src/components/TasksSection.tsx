'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, ExternalLink, Check, Gift } from 'lucide-react'
import { useUserStore, useAppStore } from '@/store/userStore'
import { ApiService } from '@/lib/api'
import { telegram } from '@/lib/telegram'
import { Task } from '@/types'
import toast from 'react-hot-toast'

export default function TasksSection() {
  const { user, updateBalance } = useUserStore()
  const { tasks, setTasks, completedTasks, setCompletedTasks, addCompletedTask } = useAppStore()

  const [completingTask, setCompletingTask] = useState<string | null>(null)

  useEffect(() => {
    loadTasks()
    if (user) {
      loadCompletedTasks()
    }
  }, [user])

  const loadTasks = async () => {
    try {
      const data = await ApiService.getTasks()
      setTasks(data)
    } catch (error) {
      console.error('Failed to load tasks:', error)
      toast.error('Failed to load tasks')
    }
  }

  const loadCompletedTasks = async () => {
    if (!user) return
    try {
      const data = await ApiService.getCompletedTasks(user.id)
      setCompletedTasks(data)
    } catch (error) {
      console.error('Failed to load completed tasks:', error)
    }
  }

  const handleTaskClick = async (task: Task) => {
    if (!user || completedTasks.includes(task.id)) return

    // Open the task URL
    if (task.task_url) {
      if (telegram.isInTelegram()) {
        window.Telegram.WebApp.openTelegramLink(task.task_url)
      } else {
        window.open(task.task_url, '_blank')
      }
    }

    // Start completion verification after a short delay
    setTimeout(() => {
      verifyTaskCompletion(task)
    }, 2000)
  }

  const verifyTaskCompletion = async (task: Task) => {
    if (!user || completingTask) return

    const confirmed = await telegram.showConfirm(
      `Have you completed the task: "${task.title}"?`
    )

    if (!confirmed) return

    setCompletingTask(task.id)
    try {
      await ApiService.completeTask(user.id, task.id)
      updateBalance(task.reward)
      addCompletedTask(task.id)
      toast.success(`🎉 Task completed! +${task.reward.toFixed(6)} TRX`)
      telegram.hapticFeedback('medium')
    } catch (error) {
      toast.error((error as Error).message || 'Failed to complete task')
      console.error(error)
    } finally {
      setCompletingTask(null)
    }
  }

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'telegram_channel':
        return '📢'
      case 'telegram_bot':
        return '🤖'
      case 'external':
        return '🌐'
      default:
        return '📋'
    }
  }

  const getTaskTypeLabel = (taskType: string) => {
    switch (taskType) {
      case 'telegram_channel':
        return 'Join Channel'
      case 'telegram_bot':
        return 'Start Bot'
      case 'external':
        return 'External Link'
      default:
        return 'Task'
    }
  }

  const formatTRX = (amount: number) => {
    return amount.toFixed(6)
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    )
  }

  const availableTasks = tasks.filter(task => !completedTasks.includes(task.id))
  const completedTasksData = tasks.filter(task => completedTasks.includes(task.id))
  const totalTasksEarned = completedTasksData.reduce((sum, task) => sum + task.reward, 0)

  return (
    <div className="p-4 space-y-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckSquare size={32} className="text-white" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Complete Tasks</h2>
          <p className="text-white/80 mb-4">
            Join channels, start bots, and earn TRX rewards
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-lg font-bold">{completedTasks.length}</div>
              <div className="text-white/80 text-sm">Completed</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-lg font-bold">{formatTRX(totalTasksEarned)}</div>
              <div className="text-white/80 text-sm">TRX Earned</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Available Tasks */}
      {availableTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-lg"
        >
          <h3 className="font-semibold mb-4 flex items-center space-x-2">
            <Gift size={18} className="text-green-500" />
            <span>Available Tasks</span>
          </h3>
          
          <div className="space-y-3">
            {availableTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTaskIcon(task.task_type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block">
                        {getTaskTypeLabel(task.task_type)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      +{formatTRX(task.reward)} TRX
                    </div>
                  </div>
                </div>
                
                {task.description && (
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTaskClick(task)}
                  disabled={completingTask === task.id}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {completingTask === task.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink size={18} />
                      <span>Start Task</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Completed Tasks */}
      {completedTasksData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-lg"
        >
          <h3 className="font-semibold mb-4 flex items-center space-x-2">
            <Check size={18} className="text-green-500" />
            <span>Completed Tasks</span>
          </h3>
          
          <div className="space-y-3">
            {completedTasksData.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-green-200 bg-green-50 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTaskIcon(task.task_type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <div className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded-full inline-block">
                        Completed ✓
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      +{formatTRX(task.reward)} TRX
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Tasks Available */}
      {availableTasks.length === 0 && completedTasksData.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg text-center"
        >
          <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No Tasks Available</h3>
          <p className="text-gray-600 text-sm">
            Check back later for new tasks to complete and earn more TRX!
          </p>
        </motion.div>
      )}

      {/* All Tasks Completed */}
      {availableTasks.length === 0 && completedTasksData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-6 text-white shadow-xl text-center"
        >
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-white" />
          </div>
          
          <h3 className="text-xl font-bold mb-2">🎉 All Tasks Completed!</h3>
          <p className="text-white/80 mb-4">
            Amazing work! You&apos;ve completed all available tasks.
          </p>
          
          <div className="bg-white/20 rounded-lg p-4">
            <div className="text-lg font-bold">Total Earned from Tasks</div>
            <div className="text-2xl font-bold">{formatTRX(totalTasksEarned)} TRX</div>
          </div>
          
          <div className="mt-4 text-sm text-white/80">
            New tasks will be added regularly. Keep watching ads and referring friends to earn more!
          </div>
        </motion.div>
      )}

      {/* Task Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="font-semibold mb-4">📋 How to Complete Tasks</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              1
            </div>
            <div>
              <div className="font-medium text-gray-900">Click &quot;Start Task&quot;</div>
              <div className="text-sm text-gray-600">This will open the required link</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              2
            </div>
            <div>
              <div className="font-medium text-gray-900">Complete the Action</div>
              <div className="text-sm text-gray-600">Join the channel, start the bot, etc.</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              3
            </div>
            <div>
              <div className="font-medium text-gray-900">Confirm Completion</div>
              <div className="text-sm text-gray-600">Return and confirm you completed the task</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              4
            </div>
            <div>
              <div className="font-medium text-gray-900">Earn TRX Instantly</div>
              <div className="text-sm text-gray-600">TRX is added to your balance immediately</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Earning Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <h3 className="font-semibold mb-4">💡 Maximize Your Earnings</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-2">
            <span>🎯</span>
            <span>Complete all tasks for maximum TRX rewards</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⏰</span>
            <span>New tasks are added regularly - check back often</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>👥</span>
            <span>Refer friends to unlock even bigger rewards</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📺</span>
            <span>Keep watching ads for steady income</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}