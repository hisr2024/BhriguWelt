# Hindu Calendar Conversion Notes

Web and mobile experiences must capture the native's **date of birth**, **time of
birth**, and **place of birth** before invoking any Bhrigu Samhita engine. The
Gregorian (English) date is automatically converted into the Hindu national
Śaka calendar so that the lunar tithi, paksha, and manuscript alignments are
consistent with traditional Panchanga compilations.

## Methodology

1. Determine whether the Gregorian year is a leap year.
2. Anchor Chaitra 1 to **21 March** on leap years and **22 March** on common
   years, per the Government of India's Calendar Reform Committee.
3. Subtract 78 (or 79 prior to Chaitra 1) from the Gregorian year to obtain the
   Śaka era year.
4. Traverse the Śaka month lengths (Chaitra 30/31, Vaisakha–Bhadra 31 each,
   Ashwin–Phalguna 30 each) to compute the Śaka month/day.
5. Tag the conversion with the **Indian Standard Time meridian (82°30' E)** so
   future Panchanga or ephemeris lookups use the authentic longitude adopted by
   the Allahabad Observatory.

The algorithm is implemented inside `backend/src/bhriguwelt/calendar_conversion.py`
and is available through both the CLI (`python -m bhriguwelt.horoscope calendar`)
and the HTTP API (`POST /calendar`).

## Authentic Indian sources

- *Report of the Calendar Reform Committee* (Government of India, 1955) – defines
  the modern Śaka calendar and IST meridian.
- *Surya Siddhanta* (trans. Bapu Deva Sastri, Calcutta, 1860) – classical Hindu
  astronomical text establishing the solar year length underpinning the Śaka era.
- *Indian Astronomical Ephemeris* (Positional Astronomy Centre, Kolkata, annual)
  – provides mean solar/lunar positions for Panchanga reconciliation.

When extending the calendar conversion logic (e.g., to include nakshatra or
tithi computations), cite additional Indian ephemerides or panchang compilations
that trace their lineage to the Surya Siddhanta or allied siddhantas.
