// Indian numbering system (Thousand, Lakh, Crore) with Paise
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitsToWords(n) {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = n % 10 ? '-' + ONES[n % 10] : '';
  return tens + ones;
}

function threeDigitsToWords(n) {
  if (n === 0) return '';
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const hPart = hundred ? ONES[hundred] + ' Hundred' : '';
  const rPart = rest ? (hPart ? ' ' : '') + twoDigitsToWords(rest) : '';
  return hPart + rPart;
}

function integerToIndianWords(n) {
  if (n === 0) return 'Zero';
  const parts = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  const lakh = Math.floor(n / 100000);
  n %= 100000;

  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const hundredRest = n; // 0..999

  if (crore) parts.push(threeDigitsToWords(crore) + ' Crore');
  if (lakh) parts.push(threeDigitsToWords(lakh) + ' Lakh');
  if (thousand) parts.push(threeDigitsToWords(thousand) + ' Thousand');
  if (hundredRest) parts.push(threeDigitsToWords(hundredRest));

  return parts.join(' ');
}

export function amountToWordsINR(amount) {
  const totalPaise = Math.round((Number(amount) || 0) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  const rupeesWords = integerToIndianWords(rupees);
  if (paise > 0) {
    const paiseWords = twoDigitsToWords(paise);
    return `INR ${rupeesWords} and ${paiseWords} Paise Only`;
  }
  return `INR ${rupeesWords} Only`;
}