'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  CreditCard, 
  CheckSquare, 
  Settings, 
  Check, 
  X, 
  Eye, 
  Ban,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { ApiService } from '@/lib/api'
import { User, Withdrawal, Task } from '@/types'
import toast from 'react-hot-toast'

type AdminTab = 'users' | 'withdrawals' | 'tasks' | 'settings'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('withdrawals')
  const [users, setUsers] = useState<User[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    reward: '',
    task_type: 'telegram_channel' as const,
    task_url: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, withdrawalsData, tasksData] = await Promise.all([
        ApiService.getAllUsers(),
        ApiService.getPendingWithdrawals(),
        ApiService.getTasks()
      ])
      
      setUsers(usersData.users)
      setWithdrawals(withdrawalsData)
      setTasks(tasksData)
    } catch (error) {
      console.error('Failed to load admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawalAction = async (
    withdrawalId: string, 
    action: 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      await ApiService.updateWithdrawalStatus(withdrawalId, action, notes)
      
      // Process referral commission if approved
      if (action === 'approved') {
        const withdrawal = withdrawals.find(w => w.id === withdrawalId)
        if (withdrawal) {
          await ApiService.processReferralCommission(withdrawal.user_id, withdrawal.amount)
        }
      }
      
      toast.success(`Withdrawal ${action} successfully`)
      loadData()
    } catch (error) {
      toast.error(`Failed to ${action} withdrawal`)
      console.error(error)
    }
  }

  const handleBlockUser = async (userId: string, blocked: boolean) => {
    try {
      await ApiService.blockUser(userId, blocked)
      toast.success(`User ${blocked ? 'blocked' : 'unblocked'} successfully`)
      loadData()
    } catch (error) {
      toast.error(`Failed to ${blocked ? 'block' : 'unblock'} user`)
      console.error(error)
    }
  }

  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.reward) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await ApiService.createTask({
        title: taskForm.title,
        description: taskForm.description,
        reward: parseFloat(taskForm.reward),
        task_type: taskForm.task_type,
        task_url: taskForm.task_url,
        is_active: true
      })
      
      toast.success('Task created successfully')
      setShowTaskForm(false)
      setTaskForm({
        title: '',
        description: '',
        reward: '',
        task_type: 'telegram_channel',
        task_url: ''
      })
      loadData()
    } catch (error) {
      toast.error('Failed to create task')
      console.error(error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      await ApiService.deleteTask(taskId)
      toast.success('Task deleted successfully')
      loadData()
    } catch (error) {
      toast.error('Failed to delete task')
      console.error(error)
    }
  }

  const formatTRX = (amount: number) => amount.toFixed(6)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'withdrawals' as const, label: 'Withdrawals', icon: CreditCard },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">TRX Earn Admin Panel</h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Pending Withdrawals</h2>
              <div className="text-sm text-gray-500">
                {withdrawals.length} pending requests
              </div>
            </div>

            {withdrawals.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Withdrawals</h3>
                <p className="text-gray-600">All withdrawal requests have been processed.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawals.map((withdrawal: any) => (
                      <tr key={withdrawal.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {withdrawal.user?.first_name} {withdrawal.user?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{withdrawal.user?.username || 'No username'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {formatTRX(withdrawal.amount)} TRX
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900 max-w-xs truncate">
                            {withdrawal.trx_wallet_address}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(withdrawal.requested_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleWithdrawalAction(withdrawal.id, 'approved')}
                            className="bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors inline-flex items-center space-x-1"
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleWithdrawalAction(withdrawal.id, 'rejected', 'Rejected by admin')}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors inline-flex items-center space-x-1"
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">User Management</h2>
              <div className="text-sm text-gray-500">
                {users.length} total users
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ads Watched</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.username || 'No username'} • ID: {user.telegram_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatTRX(user.trx_balance)} TRX
                        </div>
                        <div className="text-xs text-gray-500">
                          Earned: {formatTRX(user.total_earned)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.ads_watched}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_blocked 
                            ? 'text-red-700 bg-red-100' 
                            : 'text-green-700 bg-green-100'
                        }`}>
                          {user.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleBlockUser(user.id, !user.is_blocked)}
                          className={`px-3 py-1 rounded-lg transition-colors inline-flex items-center space-x-1 ${
                            user.is_blocked
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          <Ban size={14} />
                          <span>{user.is_blocked ? 'Unblock' : 'Block'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Task Management</h2>
              <button
                onClick={() => setShowTaskForm(true)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors inline-flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Add Task</span>
              </button>
            </div>

            <div className="grid gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg p-6 shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <p className="text-gray-600">{task.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatTRX(task.reward)} TRX
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.task_type}
                      </div>
                    </div>
                  </div>
                  
                  {task.task_url && (
                    <div className="text-sm text-blue-600 mb-4 break-all">
                      {task.task_url}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.is_active 
                        ? 'text-green-700 bg-green-100' 
                        : 'text-gray-700 bg-gray-100'
                    }`}>
                      {task.is_active ? 'Active' : 'Inactive'}
                    </span>
                    
                    <div className="space-x-2">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors inline-flex items-center space-x-1"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold">Settings</h2>
            
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold mb-4">App Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Withdrawal Amount (TRX)
                  </label>
                  <input
                    type="number"
                    value="3.5"
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Reward Amount (TRX)
                  </label>
                  <input
                    type="number"
                    value="0.005"
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Bonus (TRX)
                  </label>
                  <input
                    type="number"
                    value="0.05"
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Commission (%)
                  </label>
                  <input
                    type="number"
                    value="10"
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Task description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reward (TRX)</label>
                <input
                  type="number"
                  value={taskForm.reward}
                  onChange={(e) => setTaskForm({...taskForm, reward: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="0.01"
                  step="0.001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                <select
                  value={taskForm.task_type}
                  onChange={(e) => setTaskForm({...taskForm, task_type: e.target.value as any})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="telegram_channel">Telegram Channel</option>
                  <option value="telegram_bot">Telegram Bot</option>
                  <option value="external">External Link</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task URL</label>
                <input
                  type="url"
                  value={taskForm.task_url}
                  onChange={(e) => setTaskForm({...taskForm, task_url: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="https://t.me/your_channel"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateTask}
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Create Task
                </button>
                <button
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-4">User Details</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <div className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Username</label>
                <div className="font-medium">@{selectedUser.username || 'No username'}</div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Telegram ID</label>
                <div className="font-medium">{selectedUser.telegram_id}</div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">TRX Balance</label>
                <div className="font-medium">{formatTRX(selectedUser.trx_balance)} TRX</div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Total Earned</label>
                <div className="font-medium">{formatTRX(selectedUser.total_earned)} TRX</div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Ads Watched</label>
                <div className="font-medium">{selectedUser.ads_watched}</div>
              </div>
              
              {selectedUser.trx_wallet_address && (
                <div>
                  <label className="text-sm text-gray-600">Wallet Address</label>
                  <div className="font-mono text-sm break-all">{selectedUser.trx_wallet_address}</div>
                </div>
              )}
              
              <div>
                <label className="text-sm text-gray-600">Joined</label>
                <div className="font-medium">{formatDate(selectedUser.created_at)}</div>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}