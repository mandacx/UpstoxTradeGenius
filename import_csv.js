import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

async function importCSVData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Read CSV file
    const csvData = fs.readFileSync('attached_assets/EOD_TREND_PRICE_Report_mysql10APR2019_1749848361410.csv', 'utf8');
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    console.log('Starting CSV import...');
    console.log(`Total lines to process: ${lines.length - 1}`);

    let successCount = 0;
    let errorCount = 0;
    const batchSize = 500;
    let batch = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = lines[i].split(',');
      if (values.length < 25) continue; // Skip incomplete rows

      // Parse and prepare data
      const rowData = {
        symbol: values[0],
        expiry_dt: values[1],
        trade_date: values[2],
        open: parseFloat(values[3]) || null,
        high: parseFloat(values[4]) || null,
        low: parseFloat(values[5]) || null,
        cmp: parseFloat(values[6]) || null,
        cash_chg: parseFloat(values[7]) || null,
        indx_grp: values[8] || null,
        indx_wtg: parseFloat(values[9]) || null,
        put_int: parseFloat(values[10]) || null,
        call_int: parseFloat(values[11]) || null,
        comb_int: parseFloat(values[12]) || null,
        call_low: parseFloat(values[13]) || null,
        call_high: parseFloat(values[14]) || null,
        put_high: parseFloat(values[15]) || null,
        put_low: parseFloat(values[16]) || null,
        unused_pc: parseFloat(values[17]) || null,
        unused_pc_rev: parseFloat(values[18]) || null,
        trend_price1: parseFloat(values[19]) || null,
        trend_price2: parseFloat(values[20]) || null,
        call_oi: parseInt(values[21]) || null,
        put_oi: parseInt(values[22]) || null,
        call_diff: parseFloat(values[23]) || null,
        put_diff: parseFloat(values[24]) || null,
        comb_diff: parseFloat(values[25]) || null
      };

      batch.push(rowData);

      if (batch.length >= batchSize) {
        try {
          await insertBatch(pool, batch);
          successCount += batch.length;
          console.log(`Processed ${successCount} records...`);
        } catch (error) {
          errorCount += batch.length;
          console.error(`Error inserting batch: ${error.message}`);
        }
        batch = [];
      }
    }

    // Insert remaining records
    if (batch.length > 0) {
      try {
        await insertBatch(pool, batch);
        successCount += batch.length;
      } catch (error) {
        errorCount += batch.length;
        console.error(`Error inserting final batch: ${error.message}`);
      }
    }

    // Get final count
    const result = await pool.query('SELECT COUNT(*) FROM eod_price_report');
    const totalRecords = result.rows[0].count;

    console.log(`Import completed!`);
    console.log(`Successfully imported: ${successCount} records`);
    console.log(`Errors: ${errorCount} records`);
    console.log(`Total records in table: ${totalRecords}`);

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

async function insertBatch(pool, batch) {
  const values = batch.map((row, index) => {
    const baseIndex = index * 26;
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13}, $${baseIndex + 14}, $${baseIndex + 15}, $${baseIndex + 16}, $${baseIndex + 17}, $${baseIndex + 18}, $${baseIndex + 19}, $${baseIndex + 20}, $${baseIndex + 21}, $${baseIndex + 22}, $${baseIndex + 23}, $${baseIndex + 24}, $${baseIndex + 25}, $${baseIndex + 26})`;
  }).join(', ');

  const flatValues = batch.flatMap(row => [
    row.symbol, row.expiry_dt, row.trade_date, row.open, row.high, row.low,
    row.cmp, row.cash_chg, row.indx_grp, row.indx_wtg, row.put_int, row.call_int,
    row.comb_int, row.call_low, row.call_high, row.put_high, row.put_low,
    row.unused_pc, row.unused_pc_rev, row.trend_price1, row.trend_price2,
    row.call_oi, row.put_oi, row.call_diff, row.put_diff, row.comb_diff
  ]);

  const query = `
    INSERT INTO eod_price_report (
      symbol, expiry_dt, trade_date, open, high, low, cmp, cash_chg,
      indx_grp, indx_wtg, put_int, call_int, comb_int, call_low,
      call_high, put_high, put_low, unused_pc, unused_pc_rev,
      trend_price1, trend_price2, call_oi, put_oi, call_diff,
      put_diff, comb_diff
    ) VALUES ${values}
    ON CONFLICT (symbol, expiry_dt, trade_date) DO UPDATE SET
      open = EXCLUDED.open,
      high = EXCLUDED.high,
      low = EXCLUDED.low,
      cmp = EXCLUDED.cmp,
      cash_chg = EXCLUDED.cash_chg,
      indx_grp = EXCLUDED.indx_grp,
      indx_wtg = EXCLUDED.indx_wtg,
      put_int = EXCLUDED.put_int,
      call_int = EXCLUDED.call_int,
      comb_int = EXCLUDED.comb_int,
      call_low = EXCLUDED.call_low,
      call_high = EXCLUDED.call_high,
      put_high = EXCLUDED.put_high,
      put_low = EXCLUDED.put_low,
      unused_pc = EXCLUDED.unused_pc,
      unused_pc_rev = EXCLUDED.unused_pc_rev,
      trend_price1 = EXCLUDED.trend_price1,
      trend_price2 = EXCLUDED.trend_price2,
      call_oi = EXCLUDED.call_oi,
      put_oi = EXCLUDED.put_oi,
      call_diff = EXCLUDED.call_diff,
      put_diff = EXCLUDED.put_diff,
      comb_diff = EXCLUDED.comb_diff
  `;

  await pool.query(query, flatValues);
}

importCSVData();