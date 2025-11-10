import argparse
import pathlib
import mysql.connector
from typing import List


def load_statements(sql_path: pathlib.Path) -> List[str]:
    raw = sql_path.read_text(encoding="utf-8")
    statements = []
    current = []
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith('--'):
            continue
        current.append(line)
        if stripped.endswith(';'):
            statements.append('\n'.join(current)[:-1])  # remove trailing semicolon
            current = []
    if current:
        statements.append('\n'.join(current))
    return statements


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply patient auth migration to a MySQL database")
    parser.add_argument("--host", required=True)
    parser.add_argument("--user", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--database", required=True)
    parser.add_argument(
        "--file",
        default=str(pathlib.Path(__file__).resolve().parent.parent / "database" / "migrations" / "20241109_add_patient_auth.sql"),
        help="Path to the SQL migration file",
    )
    args = parser.parse_args()

    sql_path = pathlib.Path(args.file)
    statements = load_statements(sql_path)

    conn = mysql.connector.connect(
        host=args.host,
        user=args.user,
        password=args.password,
        database=args.database,
    )
    cursor = conn.cursor()

    try:
        for stmt in statements:
            cursor.execute(stmt)
        conn.commit()
        print("Migration applied successfully")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
