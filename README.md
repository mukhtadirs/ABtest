# 📊 A/B Test Advisor

A powerful, user-friendly web application that helps marketers and product managers analyze A/B test results with statistical rigor. Get clear, actionable insights with automatic test selection and executive-ready reports.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ab--test--advisor.vercel.app-blue?style=for-the-badge)](https://ab-test-advisor.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-96.7%25-blue?style=flat-square)](https://github.com/mukhtadirs/ABtest)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38bdf8?style=flat-square)](https://tailwindcss.com/)

## 🚀 Features

### 📱 **Mobile-First Design**
- **Responsive layout** that works perfectly on phones, tablets, and desktop
- **Touch-friendly inputs** with optimized spacing for mobile devices
- **Stacked card layout** on mobile for better data entry experience

### 🧮 **Statistical Testing**
- **Automatic test selection** based on sample sizes and data characteristics
- **Two-proportion z-test** for large sample A/B tests
- **Fisher's exact test** for small sample sizes (safer with limited data)
- **Chi-square test** for multi-variant testing (A/B/C/D/E)
- **Wilson confidence intervals** for accurate rate estimation

### 📈 **Smart Results Analysis**
- **Clear winner declarations** with statistical significance testing
- **Tie detection** for equal performance scenarios
- **Leading variant identification** when results aren't yet significant
- **Confidence intervals** and lift calculations
- **Executive-friendly language** with actionable recommendations

### 📄 **Professional Reporting**
- **PDF report generation** with ECCENTRIC branding
- **Executive summary** with key metrics and recommendations
- **Visual performance tables** with confidence intervals
- **Download and share** results with stakeholders

### ♿ **Accessibility & UX**
- **Full keyboard navigation** with shortcuts (Cmd/Ctrl + Enter to compute)
- **Screen reader support** with proper ARIA labels
- **Loading states** and error handling
- **Educational resources** with integrated YouTube explanations

## 🎯 Use Cases

- **Marketing Campaigns**: Compare CTR across different ad creatives
- **Product Features**: Test conversion rates for new UX designs
- **Email Marketing**: Analyze open and click-through rates
- **Landing Pages**: Optimize conversion rates with different layouts
- **Pricing Experiments**: Test different pricing strategies

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom responsive design
- **Build Tool**: Vite for fast development and optimized builds
- **Validation**: Zod for runtime type checking and form validation
- **PDF Generation**: jsPDF + html2canvas for client-side reports
- **Deployment**: Vercel with automatic CI/CD
- **Statistics**: Custom implementation of statistical tests

## 📊 Supported Metrics

| Metric | Description | Use Case |
|--------|-------------|----------|
| **CTR (Click-Through Rate)** | Clicks ÷ Traffic | Ad campaigns, email marketing |
| **Conversion Rate** | Conversions ÷ Traffic | Landing pages, product features |

## 🔬 Statistical Methods

### Test Selection Logic
```
Sample Size < 30 OR Expected Count < 5
  └── Fisher's Exact Test (safer for small samples)

2 Variants + Large Samples  
  └── Two-Proportion Z-Test

3+ Variants
  └── Chi-Square Test (2×K contingency table)
```

### Significance Testing
- **Alpha level**: 0.05 (95% confidence)
- **Two-tailed tests** for unbiased comparisons
- **Tie detection** with 0.0001 tolerance for equal rates

## 🚦 Getting Started

### Live Demo
Visit **[ab-test-advisor.vercel.app](https://ab-test-advisor.vercel.app)** to start analyzing your A/B tests immediately.

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/mukhtadirs/ABtest.git
   cd ABtest
   ```

2. **Navigate to the web directory**
   ```bash
   cd web
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production
```bash
npm run build
```

## 📖 How to Use

### 1. **Select Your Metric**
Choose between CTR (Click-Through Rate) or Conversion Rate based on what you're measuring.

### 2. **Enter Test Data**
- **Variant Name**: A, B, C, etc.
- **Traffic**: Total number of visitors/users
- **Clicks/Conversions**: Number of successful actions

### 3. **Analyze Results**
Click "Compute Result" to get:
- Winner or leading variant
- Statistical significance (p-value)
- Confidence intervals
- Actionable recommendations

### 4. **Download Report**
Generate a professional PDF report for stakeholder meetings.

## 🎓 Educational Features

The app includes built-in educational content to help users understand:
- **P-values** and what they actually mean
- **Statistical significance** vs practical significance  
- **Confidence intervals** and how to interpret them
- **Sample size** considerations for reliable results

## 🏗️ Project Structure

```
ABtest/
├── web/                    # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── MetricSwitch.tsx
│   │   │   ├── VariantTable.tsx
│   │   │   └── ResultsCard.tsx
│   │   ├── lib/           # Utilities and logic
│   │   │   ├── decision.ts    # Statistical test logic
│   │   │   ├── math.ts        # Mathematical functions
│   │   │   ├── format.ts      # Formatting utilities
│   │   │   └── pdfGenerator.ts # PDF report generation
│   │   ├── App.tsx        # Main application
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
├── vercel.json            # Deployment configuration
└── README.md             # This file
```

## 🔧 Configuration

### Vercel Deployment
The project is configured for Vercel deployment with:
- **Root Directory**: `web/`
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Framework**: Vite

### Environment Variables
No environment variables required - the app runs entirely client-side.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Ensure mobile responsiveness
- Add proper accessibility attributes
- Include tests for statistical functions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Statistical methods based on established A/B testing best practices
- UI/UX inspired by modern data analysis tools
- Educational content designed for practitioners without deep statistics background

## 📞 Support

- **Live App**: [ab-test-advisor.vercel.app](https://ab-test-advisor.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/mukhtadirs/ABtest/issues)
- **Repository**: [github.com/mukhtadirs/ABtest](https://github.com/mukhtadirs/ABtest)

---

**Built with ❤️ for data-driven decision making**

*Making A/B testing accessible to everyone, from marketing teams to product managers.*
