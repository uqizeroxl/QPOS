import { PrismaClient, RecordStatus } from "../generated/prisma/client";

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export const getDashboard = async (prisma: PrismaClient) => {
  const { start, end } = getTodayRange();
  const todayTransactionWhere = {
    createdAt: {
      gte: start,
      lt: end
    }
  };

  const [
    todayTransactionSummary,
    todayItemSummary,
    totalProducts,
    lowStockProducts,
    topProducts,
    recentTransactions
  ] = await prisma.$transaction([
    prisma.transaction.aggregate({
      where: todayTransactionWhere,
      _count: {
        _all: true
      },
      _sum: {
        grandTotal: true
      }
    }),
    prisma.transactionItem.aggregate({
      where: {
        transaction: todayTransactionWhere
      },
      _sum: {
        quantity: true
      }
    }),
    prisma.product.count({
      where: {
        status: RecordStatus.ACTIVE
      }
    }),
    prisma.product.findMany({
      where: {
        status: RecordStatus.ACTIVE,
        stock: {
          lte: prisma.product.fields.minimumStock
        }
      },
      orderBy: [{ stock: "asc" }, { name: "asc" }],
      select: {
        id: true,
        barcode: true,
        name: true,
        stock: true,
        minimumStock: true,
        category: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.transactionItem.groupBy({
      by: ["productId", "productBarcode", "productName"],
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          quantity: "desc"
        }
      },
      take: 5
    }),
    prisma.transaction.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        invoiceNumber: true,
        cashierName: true,
        grandTotal: true,
        createdAt: true
      }
    })
  ]);

  return {
    todaySales: todayItemSummary._sum.quantity ?? 0,
    todayRevenue: todayTransactionSummary._sum.grandTotal ?? 0,
    todayTransactions: todayTransactionSummary._count._all,
    totalProducts,
    lowStockProducts: lowStockProducts.map((product) => ({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      categoryName: product.category.name,
      stock: product.stock,
      minimumStock: product.minimumStock
    })),
    topProducts: topProducts.map((product) => ({
      productId: product.productId,
      barcode: product.productBarcode,
      name: product.productName,
      quantitySold: product._sum?.quantity ?? 0,
      totalSales: product._sum?.subtotal ?? 0
    })),
    recentTransactions: recentTransactions.map((transaction) => ({
      id: transaction.id,
      invoiceNumber: transaction.invoiceNumber,
      cashierName: transaction.cashierName,
      total: transaction.grandTotal,
      createdAt: transaction.createdAt
    }))
  };
};
