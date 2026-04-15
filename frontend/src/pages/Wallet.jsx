import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const FALLBACK_BONUS_TIERS = [
  { amount: 500,   label: '$5',   bonus: 0,   total: '$5',   bonusLabel: null },
  { amount: 1000,  label: '$10',  bonus: 0,   total: '$10',  bonusLabel: null },
  { amount: 2500,  label: '$25',  bonus: 200, total: '$27',  bonusLabel: '+$2' },
  { amount: 5000,  label: '$50',  bonus: 500, total: '$55',  bonusLabel: '+$5' },
  { amount: 10000, label: '$100', bonus: 1500, total: '$115', bonusLabel: '+$15' },
  { amount: 25000, label: '$250', bonus: 5000, total: '$300', bonusLabel: '+$50' },
]

const TRANSACTION_ICONS = {
  topup: { icon: 'fa-plus-circle', color: 'var(--sp-green, #1A7050)', bg: 'rgba(26,112,80,0.12)' },
  tip: { icon: 'fa-hand-holding-heart', color: 'var(--sp-gold, #C9A24D)', bg: 'rgba(201,162,77,0.12)' },
  subscription: { icon: 'fa-star', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  promotion: { icon: 'fa-rocket', color: '#E8653A', bg: 'rgba(232,101,58,0.12)' },
  gift_sent: { icon: 'fa-gift', color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  gift_received: { icon: 'fa-gift', color: 'var(--sp-green, #1A7050)', bg: 'rgba(26,112,80,0.12)' },
  purchase: { icon: 'fa-music', color: 'var(--sp-gold, #C9A24D)', bg: 'rgba(201,162,77,0.12)' },
  withdrawal: { icon: 'fa-building-columns', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  refund: { icon: 'fa-rotate-left', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

const USABLE_FOR = [
  { icon: 'fa-star', label: 'Subscriptions' },
  { icon: 'fa-hand-holding-heart', label: 'Tips' },
  { icon: 'fa-rocket', label: 'Promotions' },
  { icon: 'fa-music', label: 'Track Purchases' },
  { icon: 'fa-gift', label: 'Gifting' },
]

export default function Wallet() {
  const [balance, setBalance] = useState(0)
  const [currency, setCurrency] = useState('usd')
  const [isArtist, setIsArtist] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [topUpLoading, setTopUpLoading] = useState(null)
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [giftRecipient, setGiftRecipient] = useState('')
  const [giftAmount, setGiftAmount] = useState('')
  const [giftMessage, setGiftMessage] = useState('')
  const [giftSending, setGiftSending] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [bonusTiers, setBonusTiers] = useState(FALLBACK_BONUS_TIERS)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      localStorage.setItem('redirectAfterLogin', '/wallet')
      navigate('/login')
      return
    }
    loadData()
    if (searchParams.get('topup') === 'success') {
      toast.success('Top-up successful! Your balance has been updated.')
    }
    if (searchParams.get('topup') === 'cancelled') {
      toast('Top-up cancelled', { icon: 'i' })
    }
  }, [])

  const loadData = async () => {
    try {
      const [data, tiersData] = await Promise.all([
        api.getWallet(),
        api.getWalletBonusTiers().catch(() => null),
      ])
      setBalance(data.balance_cents || 0)
      setCurrency(data.currency || 'usd')
      setIsArtist(data.is_artist || false)
      setTransactions(data.transactions || [])

      if (tiersData?.tiers?.length) {
        const mapped = tiersData.tiers.map(t => {
          const amt = t.topup_amount_cents
          const bonus = t.bonus_cents || 0
          const credit = t.credit_cents || (amt + bonus)
          return {
            amount: amt,
            label: `$${(amt / 100).toFixed(amt % 100 ? 2 : 0)}`,
            bonus,
            total: `$${(credit / 100).toFixed(credit % 100 ? 2 : 0)}`,
            bonusLabel: bonus > 0 ? `+$${(bonus / 100).toFixed(bonus % 100 ? 2 : 0)}` : null,
          }
        })
        setBonusTiers(mapped)
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load wallet')
    } finally {
      setLoading(false)
    }
  }

  const formatCents = (cents) => {
    return `$${(Math.abs(cents) / 100).toFixed(2)}`
  }

  const handleTopUp = async (amountCents) => {
    setTopUpLoading(amountCents)
    try {
      const res = await api.topUpWallet(amountCents)
      if (res.checkout_url) {
        window.location.href = res.checkout_url
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start top-up')
    } finally {
      setTopUpLoading(null)
    }
  }

  const handleSendGift = async () => {
    if (!giftRecipient.trim()) {
      toast.error('Please enter a recipient email or username')
      return
    }
    const amountCents = Math.round(parseFloat(giftAmount) * 100)
    if (!amountCents || amountCents < 100) {
      toast.error('Minimum gift amount is $1.00')
      return
    }
    if (amountCents > balance) {
      toast.error('Insufficient balance')
      return
    }
    setGiftSending(true)
    try {
      await api.sendGift({
        recipient_email: giftRecipient.trim(),
        amount_cents: amountCents,
        message: giftMessage.trim(),
      })
      toast.success('Gift sent successfully!')
      setShowGiftModal(false)
      setGiftRecipient('')
      setGiftAmount('')
      setGiftMessage('')
      loadData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send gift')
    } finally {
      setGiftSending(false)
    }
  }

  const handleWithdraw = async () => {
    const amountCents = Math.round(parseFloat(withdrawAmount) * 100)
    if (!amountCents || amountCents < 2500) {
      toast.error('Minimum withdrawal is $25.00')
      return
    }
    if (amountCents > balance) {
      toast.error('Insufficient balance')
      return
    }
    setWithdrawing(true)
    try {
      await api.requestWithdrawal(amountCents)
      toast.success('Withdrawal request submitted! Funds will arrive in 2-5 business days.')
      setWithdrawAmount('')
      setShowWithdrawForm(false)
      loadData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to request withdrawal')
    } finally {
      setWithdrawing(false)
    }
  }

  const getTransactionMeta = (tx) => {
    const type = tx.type || 'topup'
    const meta = TRANSACTION_ICONS[type] || TRANSACTION_ICONS.topup
    const isCredit = ['topup', 'gift_received', 'refund'].includes(type)
    return { ...meta, isCredit }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTransactionLabel = (type) => {
    const labels = {
      topup: 'Top Up',
      tip: 'Tip',
      subscription: 'Subscription',
      promotion: 'Track Promotion',
      gift_sent: 'Gift Sent',
      gift_received: 'Gift Received',
      purchase: 'Track Purchase',
      withdrawal: 'Withdrawal',
      refund: 'Refund',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--sp-gold)' }}></i>
      </div>
    )
  }

  const maxBalance = 50000

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '30px 20px 100px' }}>

      {/* Balance Card */}
      <div style={{
        borderRadius: 20,
        padding: '28px 24px 24px',
        background: 'linear-gradient(135deg, rgba(201,162,77,0.08) 0%, rgba(26,112,80,0.06) 50%, rgba(201,162,77,0.04) 100%)',
        border: '1px solid rgba(201,162,77,0.2)',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative gold accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563), var(--sp-gold, #C9A24D))',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(201,162,77,0.3)',
          }}>
            <i className="fas fa-wallet" style={{ color: '#fff', fontSize: '1.2rem' }}></i>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
              Nashidify Balance
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--sp-gold, #C9A24D)', fontWeight: 600, fontFamily: "'Noto Sans Arabic', sans-serif" }}>
              رصيد نشيدي
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: '2.8rem', fontWeight: 800, color: 'var(--sp-text)',
            letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            {formatCents(balance)}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--sp-text-muted)', marginTop: 4 }}>
            Available balance {currency.toUpperCase()} — never expires
          </div>
        </div>

        {/* Balance bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--sp-text-muted)' }}>$0</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--sp-text-muted)' }}>Max $500</span>
          </div>
          <div style={{
            height: 6, borderRadius: 3,
            background: 'var(--sp-bg-highlight, rgba(60,60,67,0.08))',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${Math.min((balance / maxBalance) * 100, 100)}%`,
              background: 'linear-gradient(90deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Usable for */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {USABLE_FOR.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 8,
              background: 'rgba(201,162,77,0.08)',
              fontSize: '0.65rem', color: 'var(--sp-text-sub)',
            }}>
              <i className={`fas ${item.icon}`} style={{ fontSize: '0.6rem', color: 'var(--sp-gold, #C9A24D)' }}></i>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 28,
      }}>
        <button
          onClick={() => {
            const el = document.getElementById('topup-section')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
          style={{
            flex: 1, padding: '14px 10px', borderRadius: 14,
            background: 'linear-gradient(135deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))',
            border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}
        >
          <i className="fas fa-plus" style={{ color: '#111', fontSize: '1.1rem' }}></i>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111' }}>Top Up</span>
        </button>

        <button
          onClick={() => setShowGiftModal(true)}
          style={{
            flex: 1, padding: '14px 10px', borderRadius: 14,
            background: 'var(--sp-bg-card)',
            border: '1px solid var(--sp-border)',
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}
        >
          <i className="fas fa-gift" style={{ color: '#EC4899', fontSize: '1.1rem' }}></i>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sp-text)' }}>Send Gift</span>
        </button>

        {isArtist && (
          <button
            onClick={() => setShowWithdrawForm(!showWithdrawForm)}
            style={{
              flex: 1, padding: '14px 10px', borderRadius: 14,
              background: 'var(--sp-bg-card)',
              border: '1px solid var(--sp-border)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}
          >
            <i className="fas fa-building-columns" style={{ color: 'var(--sp-green, #1A7050)', fontSize: '1.1rem' }}></i>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sp-text)' }}>Withdraw</span>
          </button>
        )}
      </div>

      {/* Withdraw Section (Artist Only) */}
      {isArtist && showWithdrawForm && (
        <div style={{
          borderRadius: 14, padding: '20px',
          background: 'var(--sp-bg-card)',
          border: '1px solid var(--sp-border)',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--sp-green, #1A7050), var(--sp-green-light, #22906A))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fas fa-building-columns" style={{ color: '#fff', fontSize: '0.85rem' }}></i>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--sp-text)' }}>Withdraw Funds</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--sp-text-muted)' }}>Via Stripe Connect</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(26,112,80,0.06)',
            border: '1px solid rgba(26,112,80,0.12)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            fontSize: '0.75rem', color: 'var(--sp-text-sub)',
          }}>
            <i className="fas fa-info-circle" style={{ color: 'var(--sp-green, #1A7050)', marginRight: 6 }}></i>
            Minimum withdrawal: $25.00. Funds arrive in 2-5 business days via Stripe Connect.
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.73rem', color: 'var(--sp-text-muted)', marginBottom: 4, fontWeight: 600 }}>
                Amount (USD)
              </label>
              <input
                type="number"
                min="25"
                step="0.01"
                placeholder="25.00"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: 'var(--sp-bg-highlight, rgba(60,60,67,0.06))',
                  border: '1px solid var(--sp-border)',
                  color: 'var(--sp-text)', fontSize: '0.9rem',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              style={{
                padding: '10px 24px', borderRadius: 10,
                background: 'linear-gradient(135deg, var(--sp-green, #1A7050), var(--sp-green-light, #22906A))',
                border: 'none', color: '#fff', fontWeight: 700,
                fontSize: '0.85rem', cursor: withdrawing ? 'wait' : 'pointer',
                opacity: withdrawing ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {withdrawing ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Processing</>
              ) : (
                'Withdraw'
              )}
            </button>
          </div>

          {balance < 2500 && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
              fontSize: '0.73rem', color: '#EF4444',
            }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: 6 }}></i>
              Your balance ({formatCents(balance)}) is below the $25.00 minimum. Keep earning to unlock withdrawals!
            </div>
          )}
        </div>
      )}

      {/* Top-Up Section */}
      <div id="topup-section" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fas fa-coins" style={{ color: '#fff', fontSize: '0.85rem' }}></i>
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sp-text)', margin: 0 }}>Top Up Balance</h2>
            <p style={{ fontSize: '0.73rem', color: 'var(--sp-text-muted)', margin: 0 }}>Add funds to your Nashidify wallet</p>
          </div>
        </div>

        {balance >= maxBalance && (
          <div style={{
            background: 'rgba(201,162,77,0.08)', border: '1px solid rgba(201,162,77,0.15)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            fontSize: '0.75rem', color: 'var(--sp-gold, #C9A24D)',
          }}>
            <i className="fas fa-info-circle" style={{ marginRight: 6 }}></i>
            Your wallet has reached the maximum balance of $500. Spend some balance before topping up.
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}>
          {bonusTiers.map(tier => {
            const wouldExceedMax = balance + tier.amount + (tier.bonus || 0) > maxBalance
            const isLoading = topUpLoading === tier.amount

            return (
              <div
                key={tier.amount}
                onClick={() => {
                  if (!wouldExceedMax && !topUpLoading) handleTopUp(tier.amount)
                }}
                style={{
                  padding: '18px 12px',
                  borderRadius: 14,
                  background: wouldExceedMax ? 'var(--sp-bg-highlight)' : 'var(--sp-bg-card)',
                  border: tier.bonus
                    ? '1px solid rgba(201,162,77,0.3)'
                    : '1px solid var(--sp-border)',
                  cursor: wouldExceedMax || topUpLoading ? 'not-allowed' : 'pointer',
                  opacity: wouldExceedMax ? 0.5 : 1,
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!wouldExceedMax && !topUpLoading) {
                    e.currentTarget.style.borderColor = 'var(--sp-gold, #C9A24D)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = tier.bonus ? 'rgba(201,162,77,0.3)' : 'var(--sp-border, rgba(60,60,67,0.08))'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {tier.bonusLabel && (
                  <div style={{
                    position: 'absolute', top: -8, right: -4,
                    background: 'linear-gradient(135deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))',
                    color: '#111', fontSize: '0.55rem', fontWeight: 700,
                    padding: '2px 7px', borderRadius: 6,
                    boxShadow: '0 2px 6px rgba(201,162,77,0.3)',
                  }}>
                    {tier.bonusLabel}
                  </div>
                )}

                {isLoading ? (
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.1rem', color: 'var(--sp-gold)' }}></i>
                ) : (
                  <>
                    <div style={{
                      fontSize: '1.3rem', fontWeight: 800, color: 'var(--sp-text)',
                      marginBottom: 2,
                    }}>
                      {tier.label}
                    </div>
                    {tier.bonus ? (
                      <div style={{
                        fontSize: '0.68rem', color: 'var(--sp-gold, #C9A24D)', fontWeight: 600,
                      }}>
                        Get {tier.total}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: '0.68rem', color: 'var(--sp-text-muted)', fontWeight: 500,
                      }}>
                        No bonus
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div style={{
          marginTop: 12, fontSize: '0.68rem', color: 'var(--sp-text-muted)',
          textAlign: 'center',
        }}>
          <i className="fas fa-lock" style={{ marginRight: 4 }}></i>
          Secure payment via Stripe. 30-day refund window on all top-ups.
        </div>
      </div>

      {/* Transaction History */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sp-text)', marginBottom: 14 }}>
          Transaction History
        </h2>

        {transactions.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            borderRadius: 14, background: 'var(--sp-bg-card)',
            border: '1px solid var(--sp-border)',
          }}>
            <i className="fas fa-receipt" style={{
              fontSize: '2rem', color: 'var(--sp-text-muted)', marginBottom: 12,
              display: 'block', opacity: 0.3,
            }}></i>
            <div style={{ fontSize: '0.85rem', color: 'var(--sp-text-muted)', marginBottom: 4 }}>
              No transactions yet
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--sp-text-muted)' }}>
              Top up your wallet to get started
            </div>
          </div>
        ) : (
          <div style={{
            borderRadius: 14, overflow: 'hidden',
            border: '1px solid var(--sp-border)',
          }}>
            {transactions.map((tx, idx) => {
              const meta = getTransactionMeta(tx)
              return (
                <div
                  key={tx.id || idx}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    background: 'var(--sp-bg-card)',
                    borderBottom: idx < transactions.length - 1 ? '1px solid var(--sp-border)' : 'none',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: meta.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <i className={`fas ${meta.icon}`} style={{ color: meta.color, fontSize: '0.85rem' }}></i>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: '0.85rem', color: 'var(--sp-text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {formatTransactionLabel(tx.type)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--sp-text-muted)' }}>
                      {tx.description || formatDate(tx.created_at)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: '0.9rem',
                      color: meta.isCredit ? 'var(--sp-green, #1A7050)' : 'var(--sp-text)',
                    }}>
                      {meta.isCredit ? '+' : '-'}{formatCents(tx.amount_cents || 0)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--sp-text-muted)' }}>
                      {formatDate(tx.created_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Non-artist notice */}
      {!isArtist && (
        <div style={{
          borderRadius: 14, padding: '16px 18px',
          background: 'rgba(201,162,77,0.06)',
          border: '1px solid rgba(201,162,77,0.12)',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <i className="fas fa-info-circle" style={{ color: 'var(--sp-gold, #C9A24D)', fontSize: '0.9rem', marginTop: 2 }}></i>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--sp-text)', marginBottom: 4 }}>
                Withdrawals are for artists only
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--sp-text-sub)', lineHeight: 1.5 }}>
                Listener wallets are for spending within Nashidify (subscriptions, tips, gifts, and purchases).
                To earn and withdraw funds, upgrade to an Artist plan.
              </div>
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  marginTop: 10, padding: '8px 18px', borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))',
                  border: 'none', color: '#111', fontWeight: 700,
                  fontSize: '0.78rem', cursor: 'pointer',
                }}
              >
                View Artist Plans
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ramadan / Gifting note */}
      <div style={{
        borderRadius: 14, padding: '14px 18px',
        background: 'rgba(26,112,80,0.05)',
        border: '1px solid rgba(26,112,80,0.1)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <i className="fas fa-moon" style={{ color: 'var(--sp-green, #1A7050)', fontSize: '1rem' }}></i>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--sp-text)' }}>
            Gift balance to others
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sp-text-sub)', lineHeight: 1.4 }}>
            Send Nashidify balance as a gift during Ramadan, Eid, or any occasion. Share the blessing of beautiful nasheeds.
          </div>
        </div>
      </div>

      {/* Gift Modal */}
      {showGiftModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 20,
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setShowGiftModal(false)
          }}
        >
          <div style={{
            width: '100%', maxWidth: 420, borderRadius: 20,
            background: 'var(--sp-bg-card, #1C1C1E)',
            border: '1px solid var(--sp-border)',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'linear-gradient(135deg, #EC4899, #F472B6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="fas fa-gift" style={{ color: '#fff', fontSize: '1rem' }}></i>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--sp-text)' }}>Send a Gift</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--sp-text-muted)' }}>Share balance with someone</div>
                </div>
              </div>
              <button
                onClick={() => setShowGiftModal(false)}
                style={{
                  background: 'var(--sp-bg-highlight)', border: 'none',
                  width: 32, height: 32, borderRadius: 8,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i className="fas fa-times" style={{ color: 'var(--sp-text-muted)', fontSize: '0.85rem' }}></i>
              </button>
            </div>

            {/* Available balance */}
            <div style={{
              background: 'rgba(201,162,77,0.08)', borderRadius: 10,
              padding: '10px 14px', marginBottom: 18,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--sp-text-muted)' }}>Available</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--sp-gold, #C9A24D)' }}>{formatCents(balance)}</span>
            </div>

            {/* Recipient */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sp-text-sub)', marginBottom: 5 }}>
                Recipient email or username
              </label>
              <input
                type="text"
                placeholder="friend@example.com"
                value={giftRecipient}
                onChange={e => setGiftRecipient(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: 'var(--sp-bg-highlight, rgba(60,60,67,0.06))',
                  border: '1px solid var(--sp-border)',
                  color: 'var(--sp-text)', fontSize: '0.88rem',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sp-text-sub)', marginBottom: 5 }}>
                Amount (USD)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="5.00"
                value={giftAmount}
                onChange={e => setGiftAmount(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: 'var(--sp-bg-highlight, rgba(60,60,67,0.06))',
                  border: '1px solid var(--sp-border)',
                  color: 'var(--sp-text)', fontSize: '0.88rem',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sp-text-sub)', marginBottom: 5 }}>
                Message (optional)
              </label>
              <input
                type="text"
                placeholder="Eid Mubarak! Enjoy some nasheeds"
                value={giftMessage}
                onChange={e => setGiftMessage(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: 'var(--sp-bg-highlight, rgba(60,60,67,0.06))',
                  border: '1px solid var(--sp-border)',
                  color: 'var(--sp-text)', fontSize: '0.88rem',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSendGift}
              disabled={giftSending}
              style={{
                width: '100%', padding: '13px',
                borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #EC4899, #F472B6)',
                color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                cursor: giftSending ? 'wait' : 'pointer',
                opacity: giftSending ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {giftSending ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Sending...</>
              ) : (
                <><i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i>Send Gift</>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.65rem', color: 'var(--sp-text-muted)' }}>
              Gift balance is non-refundable once sent
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
