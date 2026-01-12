import { sudokuParser } from '@sudoku/sudoku_parser';

export function parse(input) {
  return sudokuParser.parse(input);
}

export function validate(input) {
  return sudokuParser.validate(input);
}

export function encode(grid) {
  return sudokuParser.encode(grid);
}
