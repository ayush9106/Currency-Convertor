import { useState } from 'react'
import { InputBox } from './components'
import useCurrencyInfo from './hooks/useCurrencyInfo'

const formatNumber = (num) =>
  Number.isFinite(num)
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
    : '0.00'

function App() {
  const [amount, setAmount] = useState(1)
  const [from, setFrom] = useState("usd")
  const [to, setTo] = useState("inr")

  const { data: currencyInfo, loading, error } = useCurrencyInfo(from)

  const options = Object.keys(currencyInfo)
  const amountValid = Number.isFinite(amount) && amount >= 0
  const isSameCurrency = from === to
  const convertedAmount =
    amountValid && currencyInfo[to] ? amount * currencyInfo[to] : 0

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  return (
    <div
      className="w-full h-screen flex flex-wrap justify-center items-center bg-cover bg-no-repeat"
      style={{
        backgroundImage: `url('https://images.pexels.com/photos/4968396/pexels-photo-4968396.jpeg?_gl=1*xx74bf*_ga*MTk2MjM5MzgxMC4xNzg1OTQ5NjQ3*_ga_8JE65Q40S6*czE3ODYxODY2MDUkbzQkZzEkdDE3ODYxODY2NjQkajEkbDAkaDA.')`,
      }}
    >
      <div className="w-full">
        <div className="w-full max-w-md mx-auto border border-gray-60 rounded-lg p-5 backdrop-blur-sm bg-white/30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="w-full mb-1">
              <InputBox
                label="From"
                amount={amount}
                currencyOptions={options}
                onCurrencyChange={(currency) => setFrom(currency)}
                selectCurrency={from}
                onAmountChange={(value) => setAmount(value)}
              />
            </div>
            <div className="relative w-full h-0.5">
              <button
                type="button"
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-md bg-blue-600 text-white px-2 py-0.5"
                onClick={swap}
              >
                swap
              </button>
            </div>
            <div className="w-full mt-1 mb-4">
              <InputBox
                label="To"
                amount={convertedAmount}
                currencyOptions={options}
                onCurrencyChange={(currency) => setTo(currency)}
                selectCurrency={to}
                amountDisable
              />
            </div>
            {error && (
              <p className="mb-2 text-center text-sm font-medium text-red-600">
                Could not load rates: {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || error || !amountValid || isSameCurrency}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Loading rates..."
                : isSameCurrency
                  ? "Select different currencies"
                  : `Convert ${from.toUpperCase()} to ${to.toUpperCase()}`}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-white">
            <p className="mb-1">
              1 {from.toUpperCase()} = {formatNumber(currencyInfo[to])} {to.toUpperCase()}
            </p>
            <p className="font-semibold">
              {formatNumber(amount)} {from.toUpperCase()} = {formatNumber(convertedAmount)} {to.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
