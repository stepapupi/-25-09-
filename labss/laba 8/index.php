<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Krasnoyarsk');
session_start();

const MONTHS = [
    1 => 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function renderCalendar(?int $month = null, ?int $year = null): void
{
    $today = new DateTimeImmutable('today');
    $month ??= (int) $today->format('n');
    $year ??= (int) $today->format('Y');

    if ($year < 1 || $year > 9999 || !checkdate($month, 1, $year)) {
        throw new InvalidArgumentException('Некорректный месяц или год.');
    }

    $first = new DateTimeImmutable(sprintf('%04d-%02d-01', $year, $month));
    $offset = (int) $first->format('N') - 1;
    $days = (int) $first->format('t');
    $weeks = intdiv($offset + $days + 6, 7);
    $holidays = [
        1 => range(1, 8), 2 => [23], 3 => [8], 5 => [1, 9], 6 => [12], 11 => [4],
    ];
    ?>
    <table class="calendar">
        <caption><?= MONTHS[$month] ?> <?= $year ?></caption>
        <thead>
            <tr>
                <?php foreach (['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as $weekday): ?>
                    <th scope="col"><?= $weekday ?></th>
                <?php endforeach; ?>
            </tr>
        </thead>
        <tbody>
            <?php for ($week = 0; $week < $weeks; $week++): ?>
                <tr>
                    <?php for ($column = 0; $column < 7; $column++):
                        $day = $week * 7 + $column - $offset + 1;
                        $isDay = $day >= 1 && $day <= $days;
                        $class = '';
                        $label = '';
                        if ($isDay && in_array($day, $holidays[$month] ?? [], true)) {
                            $class = 'holiday';
                            $label = ', праздник';
                        } elseif ($isDay && $column >= 5) {
                            $class = 'weekend';
                            $label = ', выходной';
                        }
                        ?>
                        <td class="<?= $class ?>">
                            <?php if ($isDay): ?>
                                <?= $day ?><span class="visually-hidden"><?= $label ?></span>
                            <?php endif; ?>
                        </td>
                    <?php endfor; ?>
                </tr>
            <?php endfor; ?>
        </tbody>
    </table>
    <?php
}

function postValue(string $key): string
{
    $value = $_POST[$key] ?? '';
    return is_string($value) ? $value : '';
}

$today = new DateTimeImmutable('today');
$maxBirthDate = $today->format('Y-m-d');
$month = filter_input(INPUT_GET, 'month', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 12]]);
$year = filter_input(INPUT_GET, 'year', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 9999]]);
$calendarError = $month === false || $year === false;
$month = $month ?: (int) $today->format('n');
$year = $year ?: (int) $today->format('Y');

$_SESSION['registration_token'] ??= bin2hex(random_bytes(32));
$success = $_SESSION['registration_success'] ?? '';
unset($_SESSION['registration_success']);
$errors = [];
$name = '';
$login = '';
$birth = '';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $name = trim(postValue('name'));
    $login = trim(postValue('login'));
    $birth = postValue('birth');
    $password = postValue('password');

    if (!hash_equals($_SESSION['registration_token'], postValue('token'))) {
        $errors['form'] = 'Откройте страницу заново и повторите отправку формы.';
    }
    if (!preg_match("/^[\p{L}\p{M}]+(?:[ ’'\x{002D}][\p{L}\p{M}]+)*$/uD", $name) || preg_match('/^.{1,150}$/usD', $name) !== 1) {
        $errors['name'] = 'Введите ФИО. Допустимы буквы, пробелы, дефисы и апострофы.';
    }
    if (!preg_match('/^[a-zA-Z0-9_]{3,32}$/D', $login)) {
        $errors['login'] = 'Введите от 3 до 32 латинских букв, цифр или знаков подчёркивания.';
    } elseif (isset($_SESSION['users'][strtolower($login)])) {
        $errors['login'] = 'Этот логин уже занят в текущей сессии.';
    }
    if (strlen($password) > 72 || str_contains($password, "\0") || !preg_match('/^.{8,}$/usD', $password) || trim($password) === '') {
        $errors['password'] = 'Введите минимум 8 символов. Максимум — 72 байта.';
    }
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/D', $birth, $parts)
        || !checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1])
        || $birth > $maxBirthDate) {
        $errors['birth'] = 'Укажите существующую дату рождения не позже сегодняшнего дня.';
    }

    if (!$errors) {
        $_SESSION['users'][strtolower($login)] = [
            'name' => $name,
            'login' => $login,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'birth' => $birth,
        ];
        $_SESSION['registration_success'] = "Пользователь $login зарегистрирован.";
        header('Location: ?' . http_build_query(['month' => $month, 'year' => $year]) . '#registration', true, 303);
        exit;
    }

    http_response_code(422);
}
?>
<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Таблица умножения, календарь и регистрация</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<main>
    <section>
        <h2>Таблица умножения</h2>
        <div class="table-scroll" role="region" aria-label="Таблица умножения от 0 до 10" tabindex="0">
            <table class="multiplication" aria-label="Таблица умножения от 0 до 10">
                <thead>
                    <tr>
                        <th scope="col">×</th>
                        <?php for ($column = 0; $column <= 10; $column++): ?>
                            <th scope="col"><?= $column ?></th>
                        <?php endfor; ?>
                    </tr>
                </thead>
                <tbody>
                    <?php for ($row = 0; $row <= 10; $row++): ?>
                        <tr>
                            <th scope="row"><?= $row ?></th>
                            <?php for ($column = 0; $column <= 10; $column++): ?>
                                <td><?= $row * $column ?></td>
                            <?php endfor; ?>
                        </tr>
                    <?php endfor; ?>
                </tbody>
            </table>
        </div>
    </section>

    <section id="calendar">
        <h2>Календарь</h2>
        <form method="get" action="#calendar" class="calendar-form">
            <label for="month">Месяц</label>
            <select id="month" name="month">
                <?php foreach (MONTHS as $number => $title): ?>
                    <option value="<?= $number ?>"<?= $month === $number ? ' selected' : '' ?>><?= $title ?></option>
                <?php endforeach; ?>
            </select>
            <label for="year">Год</label>
            <input id="year" name="year" type="number" min="1" max="9999" value="<?= $year ?>" required>
            <button type="submit">Показать</button>
        </form>
        <?php if ($calendarError): ?>
            <p class="error" role="alert">Укажите месяц от 1 до 12 и год от 1 до 9999.</p>
        <?php endif; ?>
        <?php if (!isset($_GET['month']) && !isset($_GET['year'])) {
            renderCalendar();
        } else {
            renderCalendar($month, $year);
        } ?>
        <div class="legend">
            <span class="weekend">Суббота и воскресенье</span>
            <span class="holiday">Праздник</span>
        </div>
    </section>

    <section id="registration">
        <h2>Регистрация</h2>
        <?php if ($success): ?>
            <p class="success" role="status"><?= escape($success) ?></p>
        <?php endif; ?>
        <?php if (isset($errors['form'])): ?>
            <p class="error" role="alert"><?= escape($errors['form']) ?></p>
        <?php endif; ?>
        <form method="post" class="registration-form" action="?month=<?= $month ?>&amp;year=<?= $year ?>#registration">
            <input type="hidden" name="token" value="<?= escape($_SESSION['registration_token']) ?>">
            <?php
            $fields = [
                'name' => ['ФИО', 'text', 'name', $name, ' maxlength="150"'],
                'login' => ['Логин', 'text', 'username', $login, ' minlength="3" maxlength="32"'],
                'password' => ['Пароль', 'password', 'new-password', '', ' minlength="8"'],
                'birth' => ['Дата рождения', 'date', 'bday', $birth, ' max="' . $maxBirthDate . '"'],
            ];
            foreach ($fields as $id => [$label, $type, $autocomplete, $value, $constraints]):
                ?>
                <div class="field">
                    <label for="<?= $id ?>"><?= $label ?></label>
                    <input id="<?= $id ?>" name="<?= $id ?>" type="<?= $type ?>"
                           autocomplete="<?= $autocomplete ?>" value="<?= escape($value) ?>" required<?= $constraints ?>
                           <?= isset($errors[$id]) ? 'aria-invalid="true" aria-describedby="' . $id . '-error"' : '' ?>>
                    <?php if (isset($errors[$id])): ?>
                        <p class="error" id="<?= $id ?>-error"><?= escape($errors[$id]) ?></p>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
            <button type="submit">Зарегистрироваться</button>
        </form>
    </section>
</main>
</body>
</html>
