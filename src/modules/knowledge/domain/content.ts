export type TaxArticle = Readonly<{
  id: string;
  slug: string;
  title: string;
  category: TaxArticleCategory;
  content: string;
  sourceReference: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  version: number;
  status: "PUBLISHED";
  reviewedAt: string;
  reviewedBy: string;
  publishedAt: string;
}>;

export type TaxArticleCategory =
  | "income-tax"
  | "withholding"
  | "vat"
  | "property"
  | "capital-gains"
  | "digital-services"
  | "deductions"
  | "exemptions"
  | "penalties"
  | "procedures";

export const TAX_ARTICLES: TaxArticle[] = [
  {
    id: "TAX-ART-001",
    slug: "maliyat-in-omumi",
    title: "معارف کلی مالیات درآمد ایران",
    category: "income-tax",
    content: `مالیات درآمد بر اساس اصل ۵۳ قانون اساسی جمهوری اسلامی ایران و آیین‌نامه اجرایی آن، بر درآمدهای کسب‌وکاری، فعالیت‌های فراگیر، استخدامی و سایر درآمدها اعمال می‌شود. این مالیات بر درآمد سالانه و بر اساس جدول سرکلیه و نرخ‌های پیشرونده محاسبه می‌گردد.`,
    sourceReference: "قانون مالیات درآمد، ماده ۵۳ قانون اساسی، آیین‌نامه اجرایی ۱۴۰۴",
    effectiveFrom: "1403-04-01",
    effectiveTo: null,
    version: 1,
    status: "PUBLISHED",
    reviewedAt: "1404-01-01",
    reviewedBy: "سازمان مالیات‌تخلف‌های کشور",
    publishedAt: "1404-01-15",
  },
  {
    id: "TAX-ART-002",
    slug: "serkale",
    title: "سرکلیه مالیات درآمد ۱۴۰۴",
    category: "exemptions",
    content: `سرکلیه سالانه مالیات درآمد افراد طبیعی در سال ۱۴۰۴ برابر با ۶۰۰,۰۰۰,۰۰۰ ریال (۶۰۰ میلیون ریال) اعلام شده است. درآمد سالانه کمتر از این مبلغ ملزم به پرداخت مالیات درآمد نمی‌باشد. سرکلیه ماهانه معادل ۵۰,۰۰۰,۰۰۰ ریال می‌باشد.`,
    sourceReference: "آیین‌نامه اجرایی قانون مالیات درآمد افراد طبیعی - اصلاح ۱۴۰۴",
    effectiveFrom: "1403-04-01",
    effectiveTo: null,
    version: 1,
    status: "PUBLISHED",
    reviewedAt: "1404-01-01",
    reviewedBy: "سازمان مالیات‌تخلف‌های کشور",
    publishedAt: "1404-01-15",
  },
  {
    id: "TAX-ART-003",
    slug: "naraaje-in-omumi",
    title: "نرخ‌های مالیاتی پیشرونده بر درآمد کار",
    category: "income-tax",
    content: `نرخ‌های مالیات درآمد کار بر اساس مبلغ مالیات‌خورده‌ها (درآمد نزدیک سرکلیه) به شرح زیر اعمال می‌شود:
• ۱۰% برای بین ۶۰۰ میلیون تا ۸۰۰ میلیون ریال
• ۱۵% برای بین ۸۰۰ میلیون تا ۱,۱۵۰ میلیون ریال
• ۲۰% برای بین ۱,۱۵۰ میلیون تا ۱,۹۰۰ میلیون ریال
• ۲۵% برای بین ۱,۹۰۰ میلیون تا ۲,۷۰۰ میلیون ریال
• ۳۰% برای بین ۲,۷۰۰ میلیون تا ۴,۱۰۰ میلیون ریال
• ۳۵% برای مبالغ بالای ۴,۱۰۰ میلیون ریال
هر نرخ فقط بر مبلغ متعلق به همان بازه اعمال می‌شود (نرخ حاشیه‌ای).`,
    sourceReference: "آیین‌نامه اجرایی قانون مالیات درآمد افراد طبیعی - جدول نرخ‌های مالیاتی ۱۴۰۴",
    effectiveFrom: "1403-04-01",
    effectiveTo: null,
    version: 1,
    status: "PUBLISHED",
    reviewedAt: "1404-01-01",
    reviewedBy: "سازمان مالیات‌تخلف‌های کشور",
    publishedAt: "1404-01-15",
  },
  {
    id: "TAX-ART-004",
    slug: "masdari",
    title: "مالیات مصدری و مالیات پیش‌پرداختی",
    category: "withholding",
    content: `مالیات مصدری به نرخ ۱۰% از مبالغ پرداختی (حقوق، خدمات، اجاره، فروش کالاها و خدمات) توسط پرداخت‌کننده در لحظه پرداخت محاسب و کسر می‌شود. مالیات مصدری به عنوان پیش‌پرداختی وارد حساب مالیات نهایی مالیات‌دهنده می‌گردد و در صورت بیشتر بودن بر مالیات نهایی، مبلغ اضافه قابل استرداد یا کسر از مالیات دوره بعدی است.`,
    sourceReference: "آیین‌نامه اجرایی قانون مالیات درآمد - مصادر مالیاتی (ماده ۵۴ و اصلاحات)",
    effectiveFrom: "1403-04-01",
    effectiveTo: null,
    version: 1,
    status: "PUBLISHED",
    reviewedAt: "1404-01-01",
    reviewedBy: "سازمان مالیات‌تخلف‌های کشور",
    publishedAt: "1404-01-15",
  },
  {
    id: "TAX-ART-005",
    slug: "vat",
    title: "مالیات بر ارزش افزوده (VAT) ایران",
    category: "vat",
    content: `مالیات بر ارزش افزوده در ایران بر اساس قانون مالیات بر ارزش افزوده، در سال ۱۳۹۰ اجرایی شد و نرخ استاندارد آن ۹% می‌باشد. این مالیات بر ارزش افزوده در هر مرحله تولید و توزیع اعمال شده و مصرف‌کننده نهایی بار مالیاتی را تحمل می‌کند.`,
    sourceReference: "قانون مالیات بر ارزش افزوده جمهوری اسلامی ایران (۱۳۸۹)",
    effectiveFrom: "1390-01-01",
    effectiveTo: null,
    version: 1,
    status: "PUBLISHED",
    reviewedAt: "1404-01-01",
    reviewedBy: "سازمان مالیات‌تخلف‌های کشور",
    publishedAt: "1404-01-15",
  },
  {
    id: "TAX-ART-006",
    slug: "takhfifat",
    title: "تخصیص‌ها و تخفیف‌های مالیاتی",
    category: "deductions",
    content: `تخصیص‌های قانونی در محاسبه مالیات درآمد شامل موارد زیر می‌شود:
• تابعیت اجباری سازمانی: ۷.۵% حقوق
• اجاره مسکن: حداکثر ۳۰۰ میلیون ریال سالانه
• بیمه درمان: حداکثر ۱۰۰ میلیون ریال سالانه
• بیمه عمر: حداکثر ۵۰ میلیون ریال سالانه
• هزینه آموزشی: حداکثر ۵۰ میلیون ریال سالانه
• هزینه‌های درمانی: حداکثر ۱۰۰ میلیون ریال سالانه
توجه: تمامی تخصیص‌ها باید مدرک و فاکتور رسمی داشته باشد.`,
    sourceReference: "آیین‌نامه اجرایی قانون مالیات درآمد - مقادیر تخصیص‌ها و حدود اقصی",
    effectiveFrom: "1403-04-01",
    effectiveTo: null,
    version: 1,
    status: "PUBLISHED",
    reviewedAt: "1404-01-01",
    reviewedBy: "سازمان مالیات‌تخلف‌های کشور",
    publishedAt: "1404-01-15",
  },
  {
    id: "TAX-ART-007",
    slug: "maliateh-omolkhas",
    title: "مالیات بر اموال خالص",
    category: "property",
    content: `مالیات بر اموال خالص به نرخ ۲% ارزش تقدیری ملک و اموال ثبتی اعمال می‌شود. این مالیات بر اساس سند مالکیت و ارزش تقدیری شناسایی‌شده توسط سازمان مالیات‌تخلف‌های کشور محاسبه می‌گردد.`,
    sourceReference: "قانون مالیات بر اموال خالص",
    effectiveFrom: "1403-04-01",
    effectiveTo: null,
    version: 1,
    status: "PUBLISHED",
    reviewedAt: "1404-01-01",
    reviewedBy: "سازمان مالیات‌تخلف‌های کشور",
    publishedAt: "1404-01-15",
  },
  {
    id: "TAX-ART-008",
    slug: "savab-e-armal",
    title: "مالیات بر سود استفاده از ارز و طلا",
    category: "capital-gains",
    content: `سود حاصل از معاملات ارزی و طلا در بازار آزاد مشمول مالیات درآمد می‌باشد. نرخ مالیات بر سود معاملات ارز طلا ۱۵% ارزش افزوده شده است. این مالیات بر تفاوت قیمت خرید و فروش محاسبه شده و توسط صرافی‌ها به عنوان مالیات مصدری کسر می‌گردد.`,
    sourceReference: "اصلاح آیین‌نامه مالیات درآمد - مصادر معاملات ارزی و طلایی",
    effectiveFrom: "1403-04-01",
    effectiveTo: null,
    version: 1,
    status: "PUBLISHED",
    reviewedAt: "1404-01-01",
    reviewedBy: "سازمان مالیات‌تخلف‌های کشور",
    publishedAt: "1404-01-15",
  },
  {
    id: "TAX-ART-009",
    slug: "khidmat-haayi",
    title: "مالیات بر خدمات دیجیتال و آنلاین",
    category: "digital-services",
    content: `بر اساس اصلاحات اخیر آیین‌نامه مالیات درآمد، درآمدهای حاصل از ارائه خدمات دیجیتال و آنلاین (شامل فریلنسری، فروشگاه‌های آنلاین، معاملات دیجیتال) مشمول مالیات درآمد می‌باشد. نرخ مالیات بر خدمات دیجیتال ۹% مالیات بر ارزش افزوده و مالیات درآمد بر اساس درآمد خالص کسب‌وکاری اعمال می‌شود.`,
    sourceReference: "آیین‌نامه اجرایی قانون مالیات درآمد - اصلاحات خدمات دیجیتال ۱۴۰۳",
    effectiveFrom: "1403-04-01",
    effectiveTo: null,
    version: 1,
    status: "PUBLISHED",
    reviewedAt: "1404-01-01",
    reviewedBy: "سازمان مالیات‌تخلف‌های کشور",
    publishedAt: "1404-01-15",
  },
  {
    id: "TAX-ART-010",
    slug: "tahavol-mali",
    title: "فرآیند تأسیس و فعالیت مالیاتی",
    category: "procedures",
    content: `برای فعالیت مالیاتی باید نسبت به سازمان مالیات‌تخلف‌های کشور ثبت‌نام شده و کد مالیاتی دریافت گردد. فرآیند شامل: ثبت‌نام، دریافت کد مالیاتی، گزارش‌دهی ماهانه، پرداخت مالیات پیش‌پرداختی، و تهیه صورت‌حساب سالانه می‌باشد.`,
    sourceReference: "آیین‌نامه اجرایی مالیاتی - فرآیندهای اداری",
    effectiveFrom: "1403-04-01",
    effectiveTo: null,
    version: 1,
    status: "PUBLISHED",
    reviewedAt: "1404-01-01",
    reviewedBy: "سازمان مالیات‌تخلف‌های کشور",
    publishedAt: "1404-01-15",
  },
];
